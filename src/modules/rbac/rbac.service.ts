import { withAssignedBy, withGrantedBy, withUpdatedBy } from '@/decorators/audit.decorators.js';
import { BaseAuditService } from '@/services/base-owned.service.js';
import { HttpError } from '@/utils/http.error.js';

import { Role } from './rbac.schema.js';
import {
  CreateAssignmentBody,
  CreatePermissionBody,
  PermissionScopeParams,
  PermissionScopeType,
} from './rbac.schema.js';
import { RoleAssignmentRepository } from './role-assignment.repository.js';
import { RolePermissionRepository } from './role-permission.repository.js';
import { RoleRepository } from './role.repository.js';

const ASSIGNMENT_INCLUDE = {
  granter: { select: { id: true, name: true, email: true } },
  assignedUser: { select: { id: true, name: true, email: true } },
  assignedTeam: { select: { id: true, name: true } },
  assignedOrg: { select: { id: true, name: true } },
  role: { select: { id: true, name: true, slug: true } },
};

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

  private async ensureAssignmentExists(id: string, roleId?: string) {
    const where: any = { id };
    if (roleId) where.roleId = roleId;

    const exists = await this.roleAssignmentRepo.exists({ where });
    if (!exists) throw new HttpError(404, 'La asignación no existe');
  }

  // ==========================================
  // Permisos
  // ==========================================

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
        moduleId: data.moduleId,
        action: data.action,
        roleId,
      },
    });
    if (isPermission) throw new HttpError(409, 'El permiso ya existe en el rol');

    return await this.rolePermissionRepo.create({
      data: {
        moduleId: data.moduleId,
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
        OR: data.map((p) => ({ resource: p.moduleId, action: p.action })),
      },
    });

    if (existing.length > 0) {
      const duplicates = existing.map((p) => `${p.moduleId}:${p.action}`).join(', ');
      throw new HttpError(409, `Los siguientes permisos ya existen: ${duplicates}`);
    }

    return this.rolePermissionRepo.createMany({
      data: data.map((p) => ({
        moduleId: p.moduleId,
        action: p.action,
        scope: p.scope,
        roleId,
        ...withGrantedBy(grantedBy),
      })),
    });
  }

  async bulkUpdatePermissions(
    roleId: string,
    data: { id: string; scope: PermissionScopeType }[],
    updatedBy: string,
  ) {
    await this.ensureRoleExists(roleId);
    await this.ensureNotSystem(roleId);

    return this.rolePermissionRepo.transaction(async (tx) => {
      return Promise.all(
        data.map((item) =>
          tx.rolePermission.update({
            where: { id: item.id, roleId },
            data: {
              scope: item.scope,
              ...withUpdatedBy(updatedBy),
            },
          }),
        ),
      );
    });
  }

  // ==========================================
  // Asignaciones
  // ==========================================

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getAssignmentsWithCount(
    roleId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      userId?: string;
      teamId?: string;
      targetOrgId?: string;
      organizationId?: string;
      assignedFrom?: string;
      assignedTo?: string;
    },
  ) {
    const {
      skip,
      take,
      orderBy,
      userId,
      teamId,
      targetOrgId,
      organizationId,
      assignedFrom,
      assignedTo,
    } = params;

    const where: any = { roleId };

    if (userId) where.userId = userId;
    if (teamId) where.teamId = teamId;
    if (targetOrgId) where.targetOrgId = targetOrgId;
    if (organizationId) where.organizationId = organizationId;

    if (assignedFrom || assignedTo) {
      where.assignedAt = {
        ...(assignedFrom && { gte: new Date(assignedFrom) }),
        ...(assignedTo && { lte: new Date(new Date(assignedTo).setHours(23, 59, 59, 999)) }),
      };
    }

    return this.roleAssignmentRepo.findManyWithCount({
      where,
      skip,
      take: take ?? 10,
      orderBy,
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async getAssignmentById(id: string, roleId: string) {
    await this.ensureAssignmentExists(id, roleId);

    return this.roleAssignmentRepo.findFirst({
      where: { id, roleId },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  async assign(roleId: string, data: CreateAssignmentBody, assignedBy?: string) {
    const where: any = { roleId };
    if (data.userId) where.userId = data.userId;
    if (data.teamId) where.teamId = data.teamId;
    if (data.targetOrgId) where.targetOrgId = data.targetOrgId;

    const exists = await this.roleAssignmentRepo.exists({ where });
    if (exists) throw new HttpError(409, 'La asignación ya existe para este rol');

    return this.roleAssignmentRepo.create({
      data: {
        roleId,
        userId: data.userId,
        teamId: data.teamId,
        targetOrgId: data.targetOrgId,
        organizationId: data.organizationId,
        ...withAssignedBy(assignedBy),
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async unassign(id: string, roleId: string) {
    await this.ensureAssignmentExists(id, roleId);

    return this.roleAssignmentRepo.delete({ where: { id } });
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async bulkAssign(roleId: string, data: CreateAssignmentBody[], assignedBy?: string) {
    return this.roleAssignmentRepo.createMany({
      data: data.map((item) => ({
        roleId,
        userId: item.userId,
        teamId: item.teamId,
        targetOrgId: item.targetOrgId,
        organizationId: item.organizationId,
        ...withAssignedBy(assignedBy),
      })),
    });
  }

  async bulkUnassign(roleId: string, ids: string[]) {
    const assignments = await this.roleAssignmentRepo.findMany({
      where: { id: { in: ids }, roleId },
    });

    if (assignments.length !== ids.length) {
      throw new HttpError(404, 'Una o más asignaciones no pertenecen al rol');
    }

    return this.roleAssignmentRepo.deleteMany({
      where: { id: { in: ids }, roleId },
    });
  }
}
