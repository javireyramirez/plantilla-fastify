import { withAssignedBy, withGrantedBy, withUpdatedBy } from '@/decorators/audit.decorators.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { BaseRbacService } from '@/services/base-owned.service.js';
import { WriteOptions } from '@/types/base.types.js';
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
  organization: { select: { id: true, name: true } },
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

  // ==========================================
  // SCOPE DE ORGANIZACIÓN
  // ==========================================

  override async findManyWithCount(params: any) {
    return super.findManyWithCount({
      ...params,
      where: {
        ...params.where,
        OR: [
          ...(params.scope?.organizationIds?.length
            ? [{ organizationId: { in: params.scope.organizationIds } }]
            : []),
          { isSystem: true, organizationId: null },
        ],
      },
    });
  }

  override async findList(params: any) {
    return super.findList({
      ...params,
      where: {
        ...params.where,
        OR: [
          ...(params.scope?.organizationIds?.length
            ? [{ organizationId: { in: params.scope.organizationIds } }]
            : []),
          { isSystem: true, organizationId: null },
        ],
      },
    });
  }

  override async create(data: any, options: WriteOptions = {}): Promise<Role> {
    return super.create(
      {
        ...data,
        organizationId: data.organizationId ?? options.organizationId,
        isSystem: false,
      },
      options,
    );
  }

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  private async ensureRoleExists(roleId: string, organizationIds?: string[]) {
    const where: any = { id: roleId };

    if (organizationIds?.length) {
      where.OR = [
        { organizationId: { in: organizationIds } },
        { isSystem: true, organizationId: null },
      ];
    }

    const exists = await this.roleRepo.exists({ where });
    if (!exists) throw new HttpError(404, 'El rol no existe');
  }

  private async ensureRoleIsEditable(roleId: string, organizationIds?: string[]) {
    await this.ensureRoleExists(roleId, organizationIds);
    await this.ensureNotSystem(roleId);

    if (organizationIds?.length) {
      const belongsToOrg = await this.roleRepo.exists({
        where: { id: roleId, organizationId: { in: organizationIds } },
      });
      if (!belongsToOrg) {
        throw new HttpError(403, 'No tienes permisos para modificar este rol');
      }
    }
  }

  private async ensureAssignmentExists(id: string, roleId?: string) {
    const where: any = { id };
    if (roleId) where.roleId = roleId;

    const exists = await this.roleAssignmentRepo.exists({ where });
    if (!exists) throw new HttpError(404, 'La asignación no existe');
  }

  // ==========================================
  // PERMISOS — LECTURA
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
      organizationIds?: string[];
    },
  ) {
    await this.ensureRoleExists(roleId, params.organizationIds);

    const { skip, take, orderBy, resource, action, scope, grantedFrom, grantedTo } = params;
    const where: any = { roleId };

    if (resource) where.resource = { in: resource };
    if (action) where.action = { in: action };
    if (scope) where.scope = { in: scope };

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
        updater: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==========================================
  // PERMISOS — INDIVIDUALES
  // ==========================================

  async addPermission(
    roleId: string,
    data: CreatePermissionBody,
    grantedBy?: string,
    organizationIds?: string[],
  ) {
    await this.ensureRoleIsEditable(roleId, organizationIds);

    const isPermission = await this.rolePermissionRepo.exists({
      where: { moduleId: data.moduleId, action: data.action, roleId },
    });
    if (isPermission) throw new HttpError(409, 'El permiso ya existe en el rol');

    return this.rolePermissionRepo.create({
      data: {
        moduleId: data.moduleId,
        action: data.action,
        scope: data.scope,
        roleId,
        ...withGrantedBy(grantedBy),
      },
    });
  }

  async revokePermission(id: string, roleId: string, organizationIds?: string[]) {
    await this.ensureRoleIsEditable(roleId, organizationIds);

    const permission = await this.rolePermissionRepo.findFirst({ where: { id, roleId } });
    if (!permission) throw new HttpError(404, 'El permiso no se encuentra en el rol');

    return this.rolePermissionRepo.delete({ where: { id } });
  }

  async updatePermissionScope(
    id: string,
    roleId: string,
    newScope: PermissionScopeParams,
    updatedBy: string,
    organizationIds?: string[],
  ) {
    await this.ensureRoleIsEditable(roleId, organizationIds);

    const permission = await this.rolePermissionRepo.findFirst({ where: { id, roleId } });
    if (!permission) throw new HttpError(404, 'El permiso no se encuentra en el rol');

    return this.rolePermissionRepo.update({
      where: { id },
      data: { scope: newScope, ...withUpdatedBy(updatedBy) },
    });
  }

  // ==========================================
  // PERMISOS — BULK
  // ==========================================

  async bulkAddPermissions(
    roleId: string,
    data: CreatePermissionBody[],
    grantedBy?: string,
    organizationIds?: string[],
  ) {
    await this.ensureRoleIsEditable(roleId, organizationIds);

    const existing = await this.rolePermissionRepo.findMany({
      where: {
        roleId,
        OR: data.map((p) => ({ moduleId: p.moduleId, action: p.action })),
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

  async bulkRevokePermissions(roleId: string, permissionIds: string[], organizationIds?: string[]) {
    await this.ensureRoleIsEditable(roleId, organizationIds);

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

  async bulkUpdatePermissions(
    roleId: string,
    data: { id: string; scope: PermissionScopeType }[],
    updatedBy: string,
    organizationIds?: string[],
  ) {
    await this.ensureRoleIsEditable(roleId, organizationIds);

    return this.rolePermissionRepo.transaction(async (tx) => {
      return Promise.all(
        data.map((item) =>
          tx.rolePermission.update({
            where: { id: item.id, roleId },
            data: { scope: item.scope, ...withUpdatedBy(updatedBy) },
          }),
        ),
      );
    });
  }

  // ==========================================
  // ASIGNACIONES — LECTURA
  // ==========================================

  async getAssignmentsWithCount(
    roleId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
      userId?: string;
      teamId?: string;
      organizationId?: string;
      assignedFrom?: string;
      assignedTo?: string;
      organizationIds?: string[];
    },
  ) {
    await this.ensureRoleExists(roleId, params.organizationIds);

    const { skip, take, orderBy, userId, teamId, organizationId, assignedFrom, assignedTo } =
      params;
    const where: any = { roleId };

    if (userId) where.userId = userId;
    if (teamId) where.teamId = teamId;
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

  async getAssignmentById(id: string, roleId: string, organizationIds?: string[]) {
    await this.ensureRoleExists(roleId, organizationIds);
    await this.ensureAssignmentExists(id, roleId);

    return this.roleAssignmentRepo.findFirst({
      where: { id, roleId },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  // ==========================================
  // ASIGNACIONES — INDIVIDUALES
  // ==========================================

  async assign(
    roleId: string,
    data: CreateAssignmentBody,
    assignedBy?: string,
    organizationIds?: string[],
  ) {
    // Para asignar un rol solo necesitas verlo (puede ser un rol de sistema)
    await this.ensureRoleExists(roleId, organizationIds);

    const where: any = { roleId };
    if (data.userId) where.userId = data.userId;
    if (data.teamId) where.teamId = data.teamId;

    const exists = await this.roleAssignmentRepo.exists({ where });
    if (exists) throw new HttpError(409, 'La asignación ya existe para este rol');

    return this.roleAssignmentRepo.create({
      data: {
        roleId,
        userId: data.userId,
        teamId: data.teamId,
        organizationId: data.organizationId,
        ...withAssignedBy(assignedBy),
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async unassign(id: string, roleId: string, organizationIds?: string[]) {
    await this.ensureRoleExists(roleId, organizationIds);
    await this.ensureAssignmentExists(id, roleId);

    return this.roleAssignmentRepo.delete({ where: { id } });
  }

  // ==========================================
  // ASIGNACIONES — BULK
  // ==========================================

  async bulkAssign(
    roleId: string,
    data: CreateAssignmentBody[],
    assignedBy?: string,
    organizationIds?: string[],
  ) {
    await this.ensureRoleExists(roleId, organizationIds);

    return this.roleAssignmentRepo.createMany({
      data: data.map((item) => ({
        roleId,
        userId: item.userId,
        teamId: item.teamId,
        organizationId: item.organizationId,
        ...withAssignedBy(assignedBy),
      })),
    });
  }

  async bulkUnassign(roleId: string, ids: string[], organizationIds?: string[]) {
    await this.ensureRoleExists(roleId, organizationIds);

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
