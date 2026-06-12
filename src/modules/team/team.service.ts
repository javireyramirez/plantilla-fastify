import { withInvitedBy } from '@/decorators/audit.decorators.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { TeamMemberRepository } from './team-member.repository.js';
import { TeamRepository } from './team.repository.js';
import { Team } from './team.schema.js';

export class TeamService extends BaseAuditService<Team> {
  constructor(
    private readonly teamRepo: TeamRepository,
    private readonly teamMemberRepo: TeamMemberRepository,
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

  protected getAvailableSorts() {
    return {
      createdBy: { createdByUser: { name: '__order__' } },
    };
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  /**
   * Extrae los IDs de los equipos válidos a los que tiene acceso el contexto.
   */
  private extractTeamIds(scope?: any): string[] {
    if (scope?.teamIds?.length) return scope.teamIds;
    if (scope?.teamId) return [scope.teamId];
    return [];
  }

  // ==========================================
  // METODOS DE LECTURA CON CONTROL DE ÁMBITO
  // ==========================================

  override async findManyWithCount(params: any) {
    const teamIds = this.extractTeamIds(params.scope);
    return super.findManyWithCount({
      ...params,
      scope: undefined,
      where: {
        ...params.where,
        // Un usuario común solo ve los equipos a los que pertenece
        ...(teamIds.length ? { id: { in: teamIds } } : {}),
      },
    });
  }

  override async findList(params: any) {
    const teamIds = this.extractTeamIds(params.scope);
    return super.findList({
      ...params,
      scope: undefined,
      where: {
        ...params.where,
        ...(teamIds.length ? { id: { in: teamIds } } : {}),
      },
    });
  }

  override async findFirst(params: any): Promise<Team | null> {
    const teamIds = this.extractTeamIds(params.scope);
    return super.findFirst({
      ...params,
      scope: undefined,
      where: {
        ...params.where,
        ...(teamIds.length ? { id: { in: teamIds } } : {}),
      },
    });
  }

  override async create(data: any, options: WriteOptions = {}): Promise<Team> {
    return super.create(
      {
        ...data,
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

  // ==========================================
  // MIEMBROS — LECTURA
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
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // ==========================================
  // MIEMBROS — ACCIONES INDIVIDUALES
  // ==========================================

  async addMember(teamId: string, userId: string, invitedBy?: string) {
    await this.ensureTeamExists(teamId);

    const isTeamMember = await this.teamMemberRepo.exists({
      where: { teamId, userId },
    });
    if (isTeamMember) throw new HttpError(400, 'El usuario ya pertenece a este equipo');

    return this.teamMemberRepo.create({
      data: { teamId, userId, ...withInvitedBy(invitedBy) },
    });
  }

  async removeMember(teamId: string, userId: string) {
    await this.ensureTeamExists(teamId);

    try {
      return await this.teamMemberRepo.delete({
        where: { teamId_userId: { teamId, userId } },
      });
    } catch {
      throw new HttpError(404, 'El miembro no se encuentra en el equipo');
    }
  }

  // ==========================================
  // MIEMBROS — ACCIONES BULK
  // ==========================================

  async addMembers(teamId: string, userIds: string[], invitedBy?: string) {
    await this.ensureTeamExists(teamId);

    return this.teamMemberRepo.createMany({
      data: userIds.map((userId) => ({
        teamId,
        userId,
        ...withInvitedBy(invitedBy),
      })),
      skipDuplicates: true,
    });
  }

  async removeMembers(teamId: string, userIds: string[]) {
    await this.ensureTeamExists(teamId);

    return this.teamMemberRepo.deleteMany({
      where: { teamId, userId: { in: userIds } },
    });
  }
}
