import { AuthInstance } from '@/config/auth/auth.js';
import { withAssignedBy, withInvitedBy } from '@/decorators/audit.decorators.js';
import { RoleAssignmentRepository } from '@/modules/rbac/role-assignment.repository.js';
import { TeamUserRepository } from '@/modules/team/team-user.repository.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { SessionRepository } from './session.repository.js';
import { UsersRepository } from './users.repository.js';
import { CreateUsers, UpdateUserAssignmentsBody, UpdateUsers, Users } from './users.schema.js';

export class UsersService extends BaseAuditService<Users> {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly auth: AuthInstance,
    private readonly roleAssignmentRepo: RoleAssignmentRepository,
    private readonly teamUserRepo: TeamUserRepository,
  ) {
    super(usersRepo);
  }

  protected override getDefaultInclude() {
    return {
      teamUser: {
        select: {
          team: {
            select: { id: true, name: true },
          },
        },
      },
      roleAssignments: {
        select: {
          role: {
            select: { id: true, name: true },
          },
        },
      },
    };
  }
  protected override getDefaultListInclude() {
    return {};
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : { not: 'TRASHED' },
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildStringFilter('name', filters.name),
      ...this.buildStringFilter('email', filters.email),

      ...this.buildBooleanFilter('isActive', filters.isActive),
      ...this.buildBooleanFilter('isSystem', filters.isSystem),
      ...this.buildBooleanFilter('emailVerified', filters.emailVerified),

      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),
    };
  }

  private async sendSetPasswordEmail(email: string): Promise<void> {
    await this.auth.api.requestPasswordReset({
      body: { email },
    });
  }

  async create(data: CreateUsers, options: WriteOptions = {}): Promise<Users> {
    const existing = await this.usersRepo.findFirst({ where: { email: data.email } });
    if (existing) throw new HttpError(409, 'Ya existe un usuario con ese email');

    const user = await this.usersRepo.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        emailVerified: false,
        isActive: true,
        isSystem: false,
        isSuperAdmin: false,
      },
    });

    await this.sendSetPasswordEmail(data.email);

    return user as Users;
  }

  async resendInvitation(id: string): Promise<void> {
    const user = await this.usersRepo.findFirst({ where: { id, isSystem: false } });
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    if (!(user as any).email) throw new HttpError(400, 'El usuario no tiene email');

    await this.sendSetPasswordEmail((user as any).email);
  }

  async suspend(id: string, options: WriteOptions = {}): Promise<Users> {
    const user = await this.usersRepo.findFirst({
      where: { id, isActive: true, isSystem: false, ...this.getStatusFilter(false) },
    });
    if (!user) throw new HttpError(404, 'Usuario no encontrado o ya suspendido');

    // Invalida todas sus sesiones activas
    await this.sessionRepo.updateMany({
      where: { userId: id, isValid: true },
      data: { isValid: false },
    });

    return this.usersRepo.update({
      where: { id },
      data: { isActive: false, status: 'SUSPENDED' },
    }) as Promise<Users>;
  }

  async unsuspend(id: string, options: WriteOptions = {}): Promise<Users> {
    const user = await this.usersRepo.findFirst({
      where: { id, isActive: false, isSystem: false, ...this.getStatusFilter(false) },
    });
    if (!user) throw new HttpError(404, 'Usuario no encontrado o ya activo');

    return this.usersRepo.update({
      where: { id },
      data: { isActive: true, status: 'ACTIVE' },
    }) as Promise<Users>;
  }

  // ==========================================
  // BULK SUSPEND / UNSUSPEND
  // ==========================================

  async suspendMany(ids: string[], requesterId: string): Promise<{ count: number }> {
    if (!ids.length) return { count: 0 };

    // No puedes suspenderte a ti mismo en un bulk
    const safeIds = ids.filter((id) => id !== requesterId);

    await this.sessionRepo.updateMany({
      where: { userId: { in: safeIds }, isValid: true },
      data: { isValid: false },
    });

    return this.usersRepo.updateMany({
      where: { id: { in: safeIds }, isSystem: false, isActive: true },
      data: { isActive: false, status: 'SUSPENDED' },
    });
  }

  async unsuspendMany(ids: string[]): Promise<{ count: number }> {
    if (!ids.length) return { count: 0 };

    return this.usersRepo.updateMany({
      where: { id: { in: ids }, isSystem: false, isActive: false },
      data: { isActive: true, status: 'ACTIVE' },
    });
  }

  // ==========================================
  // ROLES & TEAMS ASSIGNMENTS
  // ==========================================

  async getAssignments(userId: string) {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    const roleAssignments = (await this.roleAssignmentRepo.findMany({
      where: { userId },
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
    })) as any[];

    const teamAssignments = (await this.teamUserRepo.findMany({
      where: { userId },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    })) as any[];

    return {
      roles: roleAssignments.map((ra) => ({
        id: ra.role.id,
        name: ra.role.name,
      })),
      teams: teamAssignments.map((ta) => ({
        id: ta.team.id,
        name: ta.team.name,
      })),
    };
  }

  async addAssignments(userId: string, data: UpdateUserAssignmentsBody, assignedBy?: string) {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    const { roles = [], teams = [] } = data;

    // Asignar roles
    if (roles.length > 0) {
      // Filtrar los que ya están asignados para evitar duplicados
      const existingRoles = await this.roleAssignmentRepo.findMany({
        where: { userId, roleId: { in: roles } },
      });
      const existingRoleIds = new Set(existingRoles.map((r) => r.roleId));
      const rolesToAdd = roles.filter((roleId) => !existingRoleIds.has(roleId));

      if (rolesToAdd.length > 0) {
        await this.roleAssignmentRepo.createMany({
          data: rolesToAdd.map((roleId) => ({
            roleId,
            userId,
            ...withAssignedBy(assignedBy),
          })),
        });
      }
    }

    // Asignar equipos
    if (teams.length > 0) {
      const existingTeams = await this.teamUserRepo.findMany({
        where: { userId, teamId: { in: teams } },
      });
      const existingTeamIds = new Set(existingTeams.map((t) => t.teamId));
      const teamsToAdd = teams.filter((teamId) => !existingTeamIds.has(teamId));

      if (teamsToAdd.length > 0) {
        await this.teamUserRepo.createMany({
          data: teamsToAdd.map((teamId) => ({
            teamId,
            userId,
            ...withInvitedBy(assignedBy),
          })),
        });
      }
    }

    return this.getAssignments(userId);
  }

  async removeAssignments(userId: string, data: UpdateUserAssignmentsBody) {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    const { roles = [], teams = [] } = data;

    if (roles.length > 0) {
      await this.roleAssignmentRepo.deleteMany({
        where: { userId, roleId: { in: roles } },
      });
    }

    if (teams.length > 0) {
      await this.teamUserRepo.deleteMany({
        where: { userId, teamId: { in: teams } },
      });
    }

    return this.getAssignments(userId);
  }
}
