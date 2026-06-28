import { AuthInstance } from '@/config/auth/auth.js';
import { withAssignedBy, withInvitedBy } from '@/decorators/audit.decorators.js';
import { RoleAssignmentRepository } from '@/modules/rbac/role-assignment.repository.js';
import { TeamUserRepository } from '@/modules/team/team-user.repository.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { SessionRepository } from './session.repository.js';
import { UsersRepository } from './users.repository.js';
import { CreateUsers, UpdateUsers, Users } from './users.schema.js';

export class UsersService extends BaseAuditService<Users> {
  protected override readonly moduleSlug = 'users';

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
  // ROLES ASSIGNMENTS
  // ==========================================

  async getRoleAssignments(
    userId: string,
    params: { skip?: number; take?: number; filters?: Record<string, any> } = {},
  ) {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    const filters = params.filters ?? {};

    const { data, total } = await this.roleAssignmentRepo.findManyWithCount({
      where: {
        userId,
        ...this.buildDateRangeFilter('assignedAt', filters.createdAtFrom, filters.createdAtTo),
        role: {
          ...this.buildStringFilter('name', filters.name),
        },
      },
      skip: params.skip,
      take: params.take,
      orderBy: { role: { name: 'asc' } },
      include: {
        role: true,
      },
    });

    return {
      data: data.map((ra: any) => ({
        id: ra.role.id,
        name: ra.role.name,
        assignedAt: ra.assignedAt,
      })),
      total,
    };
  }

  async addRoleAssignments(
    userId: string,
    roles: string[],
    assignedBy?: string,
  ): Promise<{ count: number }> {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    if (!roles || roles.length === 0) return { count: 0 };

    const existingRoles = await this.roleAssignmentRepo.findMany({
      where: { userId, roleId: { in: roles } },
    });
    const existingRoleIds = new Set(existingRoles.map((r) => r.roleId));
    const rolesToAdd = roles.filter((roleId) => !existingRoleIds.has(roleId));

    if (rolesToAdd.length === 0) return { count: 0 };

    return await this.roleAssignmentRepo.createMany({
      data: rolesToAdd.map((roleId) => ({
        roleId,
        userId,
        ...withAssignedBy(assignedBy),
      })),
    });
  }

  async removeRoleAssignments(userId: string, roles: string[]): Promise<{ count: number }> {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    if (!roles || roles.length === 0) return { count: 0 };

    return await this.roleAssignmentRepo.deleteMany({
      where: { userId, roleId: { in: roles } },
    });
  }

  // ==========================================
  // TEAMS ASSIGNMENTS
  // ==========================================

  async getTeamAssignments(
    userId: string,
    params: { skip?: number; take?: number; filters?: Record<string, any> } = {},
  ) {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    const filters = params.filters ?? {};

    const { data, total } = await this.teamUserRepo.findManyWithCount({
      where: {
        userId,
        ...this.buildDateRangeFilter('joinedAt', filters.createdAtFrom, filters.createdAtTo),
        team: {
          ...this.buildStringFilter('name', filters.name),
        },
      },
      skip: params.skip,
      take: params.take,
      orderBy: { team: { name: 'asc' } },
      include: {
        team: true,
      },
    });

    return {
      data: data.map((ta: any) => ({
        id: ta.team.id,
        name: ta.team.name,
        joinedAt: ta.joinedAt,
      })),
      total,
    };
  }

  async addTeamAssignments(
    userId: string,
    teams: string[],
    assignedBy?: string,
  ): Promise<{ count: number }> {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    if (!teams || teams.length === 0) return { count: 0 };

    const existingTeams = await this.teamUserRepo.findMany({
      where: { userId, teamId: { in: teams } },
    });
    const existingTeamIds = new Set(existingTeams.map((t) => t.teamId));
    const teamsToAdd = teams.filter((teamId) => !existingTeamIds.has(teamId));

    if (teamsToAdd.length === 0) return { count: 0 };

    return await this.teamUserRepo.createMany({
      data: teamsToAdd.map((teamId) => ({
        teamId,
        userId,
        ...withInvitedBy(assignedBy),
      })),
    });
  }

  async removeTeamAssignments(userId: string, teams: string[]): Promise<{ count: number }> {
    const userExists = await this.usersRepo.exists({
      where: { id: userId, ...this.getStatusFilter(false) },
    });
    if (!userExists) throw new HttpError(404, 'Usuario no encontrado');

    if (!teams || teams.length === 0) return { count: 0 };

    return await this.teamUserRepo.deleteMany({
      where: { userId, teamId: { in: teams } },
    });
  }
}
