import { withGrantedBy, withUpdatedBy } from '@/decorators/audit.decorators.js';
import { BaseAuditService } from '@/services/base.service.js';
import { HttpError } from '@/utils/http.error.js';

import { Role } from './rbac.schema.js';
import { CreatePermissionBody, PermissionScopeParams } from './rbac.schema.js';
import { RoleAssignmentRepository } from './role-assignment.repository.js';
import { RolePermissionRepository } from './role-permission.repository.js';
import { RoleRepository } from './role.repository.js';

export class RoleService extends BaseAuditService<Role> {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly rolePermissionRepo: RolePermissionRepository,
    private readonly roleAssignmentRepo: RoleAssignmentRepository,
  ) {
    super(roleRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  private async ensureRoleExists(roleId: string) {
    const exists = await this.roleRepo.exists({ where: { id: roleId } });
    if (!exists) throw new HttpError(404, 'La organización no existe');
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getPermissionsWithCount(
    roleId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      resource?: string[];
      action?: string[];
      scope?: string[];
      grantedFrom?: string;
      grantedTo?: string;
    },
  ) {
    await this.ensureRoleExists(roleId);

    const { skip, take, orderBy, resource, action, scope, grantedFrom, grantedTo } = params;

    const where: any = { roleId };

    if (resource) {
      where.resource = {
        in: resource,
      };
    }

    if (action) {
      where.action = {
        in: action,
      };
    }

    if (scope) {
      where.scope = {
        in: scope,
      };
    }

    if (roleId) where.roleId = roleId;

    if (grantedFrom || grantedTo) {
      where.grantedAt = {
        ...(grantedFrom && { gte: new Date(grantedFrom) }),
        ...(grantedTo && { lte: new Date(new Date(grantedTo).setHours(23, 59, 59, 999)) }),
      };
    }

    return this.rolePermissionRepo.findManyWithCount({
      where,
      skip,
      take: take ?? 10,
      orderBy,
      include: {
        granter: { select: { id: true, name: true, email: true } },
        revoker: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  async addPermission(roleId: string, data: CreatePermissionBody, grantedBy?: string) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    const isPermission = await this.rolePermissionRepo.exists({
      where: {
        moduleKey: data.moduleKey,
        action: data.action,
        roleId,
      },
    });
    if (isPermission) throw new HttpError(409, 'El permiso ya existe en el rol');

    return await this.rolePermissionRepo.create({
      data: {
        moduleKey: data.moduleKey,
        action: data.action,
        scope: data.scope,
        roleId,
        ...withGrantedBy(grantedBy),
      },
    });
  }

  async revokePermission(id: string, roleId: string) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    const permission = await this.rolePermissionRepo.findFirst({
      where: { id, roleId },
    });
    if (!permission) throw new HttpError(404, 'El permiso no se encuentra en el rol');

    return this.rolePermissionRepo.delete({
      where: { id },
    });
  }

  async updatePermissionScope(
    id: string,
    roleId: string,
    newScope: PermissionScopeParams,
    updatedBy: string,
  ) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    const permission = await this.rolePermissionRepo.findFirst({
      where: { id, roleId },
    });
    if (!permission) throw new HttpError(404, 'El permiso no se encuentra en el rol');

    return await this.rolePermissionRepo.update({
      where: { id },
      data: {
        scope: newScope,
        ...withUpdatedBy(updatedBy),
      },
    });
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async bulkRevokePermissions(roleId: string, permissionIds: string[]) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    const permissions = await this.rolePermissionRepo.findMany({
      where: { id: { in: permissionIds }, roleId },
    });

    if (permissions.length !== permissionIds.length) {
      throw new HttpError(404, 'Uno o más permisos no pertenecen al rol');
    }

    return this.rolePermissionRepo.deleteMany({
      where: { id: { in: permissionIds }, roleId },
    });
  }

  async bulkAddPermissions(roleId: string, data: CreatePermissionBody[], grantedBy?: string) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    const existing = await this.rolePermissionRepo.findMany({
      where: {
        roleId,
        OR: data.map((p) => ({ resource: p.moduleKey, action: p.action })),
      },
    });

    if (existing.length > 0) {
      const duplicates = existing.map((p) => `${p.moduleKey}:${p.action}`).join(', ');
      throw new HttpError(409, `Los siguientes permisos ya existen: ${duplicates}`);
    }

    return this.rolePermissionRepo.createMany({
      data: data.map((p) => ({
        moduleKey: p.moduleKey,
        action: p.action,
        scope: p.scope,
        roleId,
        ...withGrantedBy(grantedBy),
      })),
    });
  }

  async bulkUpdatePermissions(
    roleId: string,
    // Cambiamos el tipo de dato para que sea explícito que solo vamos a actualizar el scope
    data: { id: string; scope: PermissionScopeParams }[],
    updatedBy: string,
  ) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    return this.rolePermissionRepo.transaction(async (tx) => {
      const results = [];

      for (const item of data) {
        // Usamos el id para identificar el registro y el roleId para seguridad
        const updated = await tx.rolePermission.update({
          where: {
            id: item.id,
            roleId, // Garantiza que no se modifiquen permisos de otros roles
          },
          data: {
            scope: item.scope,
            ...withUpdatedBy(updatedBy),
          },
        });
        results.push(updated);
      }

      return results;
    });
  }
}
