import { AuthInstance } from '@/config/auth/auth.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { SessionRepository } from './session.repository.js';
import { UsersRepository } from './users.repository.js';
import { CreateUsers, UpdateUsers, Users } from './users.schema.js';

export class UsersService extends BaseAuditService<Users> {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly auth: AuthInstance,
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
      ...this.buildBooleanFilter('isSuperAdmin', filters.isSuperAdmin),

      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),

      ...this.buildMultiSelectFilter('sector', filters.sector),
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
}
