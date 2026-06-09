import { withInvitedBy } from '@/decorators/audit.decorators.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { OrganizationMemberRepository } from '../organization/organization-member.repository.js';
import { TeamMemberRepository } from './team-member.repository.js';
import { TeamRepository } from './team.repository.js';
import { Team } from './team.schema.js';

export class TeamService extends BaseAuditService<Team> {
  constructor(
    private readonly teamRepo: TeamRepository,
    private readonly teamMemberRepo: TeamMemberRepository,
    private readonly organizationMemberRepo: OrganizationMemberRepository,
  ) {
    super(teamRepo);
  }

  protected getDefaultInclude() {
    return {};
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildStringFilter('name', filters.name),

      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),
    };
  }

  // Define el filtro base para registros activos vs papelera

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  /**
   * Team usa organizationId (FK directa) — NO ownerOrganizationId.
   * El scope RBAC genérico no aplica aquí: filtramos por la org del usuario.
   */
  private extractOrgIds(scope?: any): string[] {
    // El scope puede traer organizationIds (array) u organizationId (string único)
    if (scope?.organizationIds?.length) return scope.organizationIds;
    if (scope?.organizationId) return [scope.organizationId];
    return [];
  }

  override async findManyWithCount(params: any) {
    const organizationIds = this.extractOrgIds(params.scope);
    return super.findManyWithCount({
      ...params,
      scope: undefined, // evitar que buildScopeFilter busque ownerOrganizationId
      where: {
        ...params.where,
        ...(organizationIds.length ? { organizationId: { in: organizationIds } } : {}),
      },
    });
  }

  override async findList(params: any) {
    const organizationIds = this.extractOrgIds(params.scope);
    return super.findList({
      ...params,
      scope: undefined,
      where: {
        ...params.where,
        ...(organizationIds.length ? { organizationId: { in: organizationIds } } : {}),
      },
    });
  }

  override async findFirst(params: any): Promise<Team | null> {
    const organizationIds = this.extractOrgIds(params.scope);
    return super.findFirst({
      ...params,
      scope: undefined,
      where: {
        ...params.where,
        ...(organizationIds.length ? { organizationId: { in: organizationIds } } : {}),
      },
    });
  }

  override async create(data: any, options: WriteOptions = {}): Promise<Team> {
    return super.create(
      {
        ...data,
        organizationId: data.organizationId ?? options.organizationId,
      },
      options,
    );
  }

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  private async ensureTeamExists(teamId: string) {
    const exists = await this.teamRepo.exists({ where: { id: teamId } });
    if (!exists) throw new HttpError(404, 'El equipo no existe');
  }

  private async resolveOrgMemberById(memberId: string) {
    const orgMember = await this.organizationMemberRepo.findUnique({
      where: { id: memberId },
    });
    if (!orgMember) {
      throw new HttpError(404, 'El miembro de organización no existe');
    }
    return orgMember;
  }

  // ==========================================
  // LECTURA
  // ==========================================

  async getMembersWithCount(
    teamId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      search?: string;
      joinedFrom?: string;
      joinedTo?: string;
    },
  ) {
    await this.ensureTeamExists(teamId);

    const { skip, take, orderBy, search, joinedFrom, joinedTo } = params;
    const where: any = { teamId };

    if (search) {
      where.member = {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (joinedFrom || joinedTo) {
      where.joinedAt = {
        ...(joinedFrom && { gte: new Date(joinedFrom) }),
        ...(joinedTo && { lte: new Date(new Date(joinedTo).setHours(23, 59, 59, 999)) }),
      };
    }

    return this.teamMemberRepo.findManyWithCount({
      where,
      skip,
      take: take ?? 10,
      orderBy,
      include: {
        member: {
          select: {
            id: true,
            userId: true,
            isActive: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  // ==========================================
  // MIEMBROS INDIVIDUALES
  // ==========================================

  async addMember(teamId: string, memberId: string, invitedBy?: string) {
    await this.ensureTeamExists(teamId);
    await this.resolveOrgMemberById(memberId);

    const isTeamMember = await this.teamMemberRepo.exists({
      where: { teamId, memberId },
    });
    if (isTeamMember) throw new HttpError(400, 'El miembro ya pertenece a este equipo');

    return this.teamMemberRepo.create({
      data: { teamId, memberId, ...withInvitedBy(invitedBy) },
    });
  }

  async removeMember(teamId: string, memberId: string) {
    await this.ensureTeamExists(teamId);

    try {
      return await this.teamMemberRepo.delete({
        where: { teamId_memberId: { teamId, memberId } },
      });
    } catch {
      throw new HttpError(404, 'El miembro no se encuentra en el equipo');
    }
  }

  // ==========================================
  // MIEMBROS BULK
  // ==========================================

  async addMembers(teamId: string, memberIds: string[], invitedBy?: string) {
    await this.ensureTeamExists(teamId);

    return this.teamMemberRepo.createMany({
      data: memberIds.map((memberId) => ({
        teamId,
        memberId,
        ...withInvitedBy(invitedBy),
      })),
      skipDuplicates: true,
    });
  }

  async removeMembers(teamId: string, memberIds: string[]) {
    await this.ensureTeamExists(teamId);

    return this.teamMemberRepo.deleteMany({
      where: { teamId, memberId: { in: memberIds } },
    });
  }
}
