import { withInvitedBy } from '@/decorators/audit.decorators.js';
import { MemberContext } from '@/modules/rbac/rbac.interfaces.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { HttpError } from '@/utils/http.error.js';

import { OrganizationMemberRepository } from './organization-member.repository.js';
import { OrganizationRepository } from './organization.repository.js';
import { Organization } from './organization.schema.js';

export class OrganizationService extends BaseAuditService<Organization> {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly organizationMemberRepo: OrganizationMemberRepository,
  ) {
    super(organizationRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  private async ensureOrganizationExists(organizationId: string) {
    const exists = await this.organizationRepo.exists({ where: { id: organizationId } });
    if (!exists) throw new HttpError(404, 'La organización no existe');
  }

  // Valida que el caller tiene acceso a esta org
  // Si no hay ctx (superadmin) se salta la validación
  private ensureOrgAccess(organizationId: string, ctx?: MemberContext | null) {
    if (ctx && !ctx.organizationIds.includes(organizationId)) {
      throw new HttpError(403, 'No tienes acceso a esta organización');
    }
  }

  // ==========================================
  // LECTURA
  // ==========================================

  async getMembersWithCount(
    organizationId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      search?: string;
      isActive?: boolean;
      joinedFrom?: string;
      joinedTo?: string;
    },
    ctx?: MemberContext | null,
  ) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    const { skip, take, orderBy, search, isActive, joinedFrom, joinedTo } = params;
    const where: any = { organizationId };

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (typeof isActive === 'boolean') where.isActive = isActive;

    if (joinedFrom || joinedTo) {
      where.joinedAt = {
        ...(joinedFrom && { gte: new Date(joinedFrom) }),
        ...(joinedTo && { lte: new Date(new Date(joinedTo).setHours(23, 59, 59, 999)) }),
      };
    }

    return this.organizationMemberRepo.findManyWithCount({
      where,
      skip,
      take: take ?? 10,
      orderBy,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==========================================
  // OPERACIONES INDIVIDUALES
  // ==========================================

  async addMember(
    organizationId: string,
    data: { userId: string },
    invitedBy?: string,
    ctx?: MemberContext | null,
  ) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    const existingMemberships = await this.organizationMemberRepo.count({
      where: { userId: data.userId },
    });

    const isMember = await this.organizationMemberRepo.exists({
      where: { userId: data.userId, organizationId },
    });

    if (isMember) throw new HttpError(400, 'El usuario ya es miembro de esta organización');

    return this.organizationMemberRepo.create({
      data: {
        organizationId,
        userId: data.userId,
        isPrimary: existingMemberships === 0,
        ...withInvitedBy(invitedBy),
      },
    });
  }

  async removeMember(organizationId: string, userId: string, ctx?: MemberContext | null) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    try {
      return await this.organizationMemberRepo.delete({
        where: { userId_organizationId: { userId, organizationId } },
      });
    } catch {
      throw new HttpError(404, 'El miembro no se encuentra en la organización');
    }
  }

  async toggleMemberStatus(
    organizationId: string,
    userId: string,
    isActive: boolean,
    ctx?: MemberContext | null,
  ) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    try {
      return await this.organizationMemberRepo.update({
        where: { userId_organizationId: { userId, organizationId } },
        data: { isActive },
      });
    } catch {
      throw new HttpError(404, 'Miembro no encontrado');
    }
  }

  async setPrimary(organizationId: string, userId: string) {
    await this.transaction(async (tx) => {
      await tx.organizationMember.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
      await tx.organizationMember.update({
        where: { userId_organizationId: { userId, organizationId } },
        data: { isPrimary: true },
      });
    });
  }

  // ==========================================
  // BULK
  // ==========================================

  async addMembers(
    organizationId: string,
    userIds: string[],
    invitedBy?: string,
    ctx?: MemberContext | null,
  ) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    return this.organizationMemberRepo.createMany({
      data: userIds.map((userId) => ({
        organizationId,
        userId,
        ...withInvitedBy(invitedBy),
      })),
      skipDuplicates: true,
    });
  }

  async removeMembers(organizationId: string, userIds: string[], ctx?: MemberContext | null) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    return this.organizationMemberRepo.deleteMany({
      where: { organizationId, userId: { in: userIds } },
    });
  }

  async toggleMembersStatus(
    organizationId: string,
    userIds: string[],
    isActive: boolean,
    ctx?: MemberContext | null,
  ) {
    await this.ensureOrganizationExists(organizationId);
    this.ensureOrgAccess(organizationId, ctx);

    return this.organizationMemberRepo.updateMany({
      where: { organizationId, userId: { in: userIds } },
      data: { isActive },
    });
  }
}
