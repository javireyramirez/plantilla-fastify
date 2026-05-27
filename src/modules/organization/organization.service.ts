import { withInvitedBy } from '@/decorators/audit.decorators.js';
import { BaseAuditService } from '@/services/base.service.js';
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

  // ==========================================
  // 1. LECTURA
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
  ) {
    await this.ensureOrganizationExists(organizationId);

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
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  async addMember(organizationId: string, data: { userId: string }, invitedBy?: string) {
    await this.ensureOrganizationExists(organizationId);

    const isMember = await this.organizationMemberRepo.exists({
      where: {
        userId: data.userId,
        organizationId,
      },
    });

    if (isMember) throw new HttpError(400, 'El usuario ya es miembro de esta organización');

    return await this.organizationMemberRepo.create({
      data: {
        organizationId,
        userId: data.userId,
        ...withInvitedBy(invitedBy),
      },
    });
  }

  async removeMember(organizationId: string, userId: string) {
    await this.ensureOrganizationExists(organizationId);

    try {
      return await this.organizationMemberRepo.delete({
        where: { userId_organizationId: { userId, organizationId } },
      });
    } catch (error) {
      throw new HttpError(404, 'El miembro no se encuentra en la organización');
    }
  }

  async toggleMemberStatus(organizationId: string, userId: string, isActive: boolean) {
    await this.ensureOrganizationExists(organizationId);

    try {
      return await this.organizationMemberRepo.update({
        where: { userId_organizationId: { userId, organizationId } },
        data: { isActive },
      });
    } catch (error) {
      throw new HttpError(404, 'Miembro no encontrado');
    }
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async addMembers(organizationId: string, userIds: string[], invitedBy?: string) {
    await this.ensureOrganizationExists(organizationId);

    return await this.organizationMemberRepo.createMany({
      data: userIds.map((userId) => ({
        organizationId,
        userId,
        ...withInvitedBy(invitedBy),
      })),
      skipDuplicates: true,
    });
  }

  async removeMembers(organizationId: string, userIds: string[]) {
    await this.ensureOrganizationExists(organizationId);

    return await this.organizationMemberRepo.deleteMany({
      where: { organizationId, userId: { in: userIds } },
    });
  }

  async toggleMembersStatus(organizationId: string, userIds: string[], isActive: boolean) {
    await this.ensureOrganizationExists(organizationId);

    return await this.organizationMemberRepo.updateMany({
      where: { organizationId, userId: { in: userIds } },
      data: { isActive },
    });
  }
}
