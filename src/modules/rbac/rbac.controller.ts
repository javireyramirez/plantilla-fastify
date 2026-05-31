import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkAssignmentIdsBodySchema,
  BulkCreateAssignmentBodySchema,
  BulkCreatePermissionBodySchema,
  BulkUpdatePermissionBodySchema,
  CreateAssignmentBodySchema,
  CreatePermissionBodySchema,
  GetAssignmentsQuery,
  GetPermissionsQuery,
  PermissionScopeParamsSchema,
  Role,
} from './rbac.schema.js';
import { RoleService } from './rbac.service.js';

export class RoleController extends BaseController<Role> {
  constructor(private readonly roleService: RoleService) {
    super(roleService);
  }

  private getOrgIds(request: FastifyRequest): string[] | undefined {
    return request.memberContext?.organizationIds;
  }

  // ==========================================
  // OVERRIDES DE BASE (scope de org)
  // ==========================================

  override async getAll(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    const {
      page = 1,
      limit = 10,
      isTrash = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...filters
    } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.roleService.findManyWithCount({
      where: this.roleService.getAuditWhere(String(isTrash) === 'true', filters),
      scope: { organizationIds: this.getOrgIds(request) },
      skip,
      take,
      orderBy,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  override async getList(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    const { limit = 20, sortBy = 'name', sortOrder = 'asc', ...filters } = request.query as any;

    const result = await this.roleService.findList({
      where: { ...filters },
      scope: { organizationIds: this.getOrgIds(request) },
      take: Number(limit),
      orderBy: { [sortBy]: sortOrder },
    });

    return reply.send(result);
  }

  // ==========================================
  // PERMISOS — LECTURA
  // ==========================================

  async getAllPermissions(
    request: FastifyRequest<{ Params: { roleId: string }; Querystring: GetPermissionsQuery }>,
    reply: FastifyReply,
  ) {
    const { roleId } = request.params;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query;
    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.roleService.getPermissionsWithCount(roleId, {
      skip,
      take,
      orderBy,
      organizationIds: this.getOrgIds(request),
      ...filters,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // PERMISOS — INDIVIDUALES
  // ==========================================

  async addPermission(
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply,
  ) {
    const body = CreatePermissionBodySchema.parse(request.body);
    const record = await this.roleService.addPermission(
      request.params.roleId,
      body,
      this.getUserId(request),
      this.getOrgIds(request),
    );
    return reply.code(201).send(record);
  }

  async revokePermission(
    request: FastifyRequest<{ Params: { id: string; roleId: string } }>,
    reply: FastifyReply,
  ) {
    const { roleId, id } = request.params;
    const record = await this.roleService.revokePermission(id, roleId, this.getOrgIds(request));
    return reply.send(record);
  }

  async updatePermissionScope(
    request: FastifyRequest<{ Params: { id: string; roleId: string } }>,
    reply: FastifyReply,
  ) {
    const { id, roleId } = request.params;
    const newScope = PermissionScopeParamsSchema.parse(request.body);
    const record = await this.roleService.updatePermissionScope(
      id,
      roleId,
      newScope,
      this.getUserId(request)!,
      this.getOrgIds(request),
    );
    return reply.send(record);
  }

  // ==========================================
  // PERMISOS — BULK
  // ==========================================

  async bulkAddPermissions(
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply,
  ) {
    const body = BulkCreatePermissionBodySchema.parse(request.body);
    const record = await this.roleService.bulkAddPermissions(
      request.params.roleId,
      body,
      this.getUserId(request),
      this.getOrgIds(request),
    );
    return reply.code(201).send(record);
  }

  async bulkRevokePermissions(
    request: FastifyRequest<{ Params: { roleId: string }; Body: { ids: string[] } }>,
    reply: FastifyReply,
  ) {
    const { roleId } = request.params;
    const { ids } = request.body;

    const record = await this.roleService.bulkRevokePermissions(
      roleId,
      ids,
      this.getOrgIds(request),
    );
    return reply.send(record);
  }

  async bulkUpdatePermissions(
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply,
  ) {
    const newScope = BulkUpdatePermissionBodySchema.parse(request.body);
    const record = await this.roleService.bulkUpdatePermissions(
      request.params.roleId,
      newScope,
      this.getUserId(request)!,
      this.getOrgIds(request),
    );
    return reply.send(record);
  }

  // ==========================================
  // ASIGNACIONES — LECTURA
  // ==========================================

  async getAllAssignments(
    request: FastifyRequest<{ Params: { roleId: string }; Querystring: GetAssignmentsQuery }>,
    reply: FastifyReply,
  ) {
    const { roleId } = request.params;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query;
    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.roleService.getAssignmentsWithCount(roleId, {
      skip,
      take,
      orderBy,
      organizationIds: this.getOrgIds(request),
      ...filters,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  async getAssignmentById(
    request: FastifyRequest<{ Params: { roleId: string; id: string } }>,
    reply: FastifyReply,
  ) {
    const { roleId, id } = request.params;
    const record = await this.roleService.getAssignmentById(id, roleId, this.getOrgIds(request));
    return reply.send(record);
  }

  // ==========================================
  // ASIGNACIONES — INDIVIDUALES
  // ==========================================

  async assign(request: FastifyRequest<{ Params: { roleId: string } }>, reply: FastifyReply) {
    const body = CreateAssignmentBodySchema.parse(request.body);
    const record = await this.roleService.assign(
      request.params.roleId,
      body,
      this.getUserId(request),
      this.getOrgIds(request),
    );
    return reply.code(201).send(record);
  }

  async unassign(
    request: FastifyRequest<{ Params: { roleId: string; id: string } }>,
    reply: FastifyReply,
  ) {
    const { roleId, id } = request.params;
    const record = await this.roleService.unassign(id, roleId, this.getOrgIds(request));
    return reply.send(record);
  }

  // ==========================================
  // ASIGNACIONES — BULK
  // ==========================================

  async bulkAssign(request: FastifyRequest<{ Params: { roleId: string } }>, reply: FastifyReply) {
    const body = BulkCreateAssignmentBodySchema.parse(request.body);
    const record = await this.roleService.bulkAssign(
      request.params.roleId,
      body,
      this.getUserId(request),
      this.getOrgIds(request),
    );
    return reply.code(201).send(record);
  }

  async bulkUnassign(
    request: FastifyRequest<{ Params: { roleId: string }; Body: { ids: string[] } }>,
    reply: FastifyReply,
  ) {
    const { ids } = BulkAssignmentIdsBodySchema.parse(request.body);
    const record = await this.roleService.bulkUnassign(
      request.params.roleId,
      ids,
      this.getOrgIds(request),
    );
    return reply.send(record);
  }
}
