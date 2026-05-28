import { withInvitedBy } from '@/decorators/audit.decorators.js';
import { BaseRbacService } from '@/services/base-owned.service.js';
import { HttpError } from '@/utils/http.error.js';

import { OrganizationMemberRepository } from '../organization/organization-member.repository.js';
import { TeamMemberRepository } from './team-member.repository.js';
import { TeamRepository } from './team.repository.js';
import { Team } from './team.schema.js';

export class TeamService extends BaseRbacService<Team> {
  constructor(
    private readonly teamRepo: TeamRepository,
    private readonly teamMemberRepo: TeamMemberRepository,
    private readonly organizationMemberRepo: OrganizationMemberRepository,
  ) {
    super(teamRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  private async ensureTeamExists(teamId: string) {
    const exists = await this.teamRepo.exists({ where: { id: teamId } });
    if (!exists) throw new HttpError(404, 'El equipo no existe');
  }

  /**
   * Resuelve el OrganizationMember a partir de un userId + organizationId.
   * TeamMember referencia OrganizationMember, no User directamente.
   */
  private async resolveOrgMember(userId: string, organizationId: string) {
    const orgMember = await this.organizationMemberRepo.findUnique({
      where: { userId, organizationId },
    });
    if (!orgMember) {
      throw new HttpError(404, 'El usuario no es miembro de la organización del equipo');
    }
    return orgMember;
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

  private async getTeamOrganizationId(teamId: string): Promise<string> {
    const team = await this.teamRepo.findUnique({ where: { id: teamId } });
    if (!team) throw new HttpError(404, 'El equipo no existe');
    return (team as any).organizationId;
  }

  // ==========================================
  // 1. LECTURA
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
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  async addMember(teamId: string, memberId: string, invitedBy?: string) {
    await this.ensureTeamExists(teamId);

    // Verificar que el orgMember existe
    await this.resolveOrgMemberById(memberId);

    const isTeamMember = await this.teamMemberRepo.exists({
      where: { teamId, memberId },
    });

    if (isTeamMember) throw new HttpError(400, 'El miembro ya pertenece a este equipo');

    return await this.teamMemberRepo.create({
      data: {
        teamId,
        memberId,
        ...withInvitedBy(invitedBy),
      },
    });
  }

  async removeMember(teamId: string, memberId: string) {
    await this.ensureTeamExists(teamId);

    try {
      return await this.teamMemberRepo.delete({
        where: { teamId_memberId: { teamId, memberId } },
      });
    } catch (error) {
      throw new HttpError(404, 'El miembro no se encuentra en el equipo');
    }
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async addMembers(teamId: string, memberIds: string[], invitedBy?: string) {
    await this.ensureTeamExists(teamId);

    return await this.teamMemberRepo.createMany({
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

    return await this.teamMemberRepo.deleteMany({
      where: { teamId, memberId: { in: memberIds } },
    });
  }
}
