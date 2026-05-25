import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkCreatePermissionBodySchema,
  BulkUpdatePermissionBodySchema,
  CreatePermissionBodySchema,
  GetPermissionsQuery,
  Role,
} from './rbac.schema.js';
import { RoleService } from './rbac.service.js';

export class RoleController extends BaseController<Role> {
  constructor(private readonly roleService: RoleService) {
    super(roleService);
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getAllPermissions(
    request: FastifyRequest<{ Params: { id: string }; Querystring: GetPermissionsQuery }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query;
    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.roleService.getPermissionsWithCount(id, {
      skip,
      take,
      orderBy,
      ...filters,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  async addPermission(
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply,
  ) {
    const grantedBy = (request.session as any)?.user?.id;
    const { roleId } = request.params;
    const body = CreatePermissionBodySchema.parse(request.body);

    const record = await this.roleService.addPermission(roleId, body, grantedBy);
    return reply.code(201).send(record);
  }

  async revokePermission(
    request: FastifyRequest<{ Params: { id: string; roleId: string } }>,
    reply: FastifyReply,
  ) {
    const { roleId, id } = request.params;

    const record = await this.roleService.revokePermission(id, roleId);
    return reply.send(record);
  }

  async updatePermission(
    request: FastifyRequest<{ Params: { id: string; roleId: string } }>,
    reply: FastifyReply,
  ) {
    const updatedBy = (request.session as any)?.user?.id;
    const { id, roleId } = request.params;
    const body = CreatePermissionBodySchema.parse(request.body);

    const record = await this.roleService.updatePermission(id, roleId, updatedBy, body);
    return reply.send(record);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async bulkAddPermissions(
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply,
  ) {
    const grantedBy = (request.session as any)?.user?.id;
    const { roleId } = request.params;
    const body = BulkCreatePermissionBodySchema.parse(request.body);

    const record = await this.roleService.bulkAddPermissions(roleId, body, grantedBy);
    return reply.code(201).send(record);
  }

  async bulkRevokePermissions(
    request: FastifyRequest<{ Params: { roleId: string }; Body: string[] }>,
    reply: FastifyReply,
  ) {
    const { roleId } = request.params;
    const body = request.body;

    const record = await this.roleService.bulkRevokePermissions(roleId, body);
    return reply.send(record);
  }

  async bulkUpdatePermissions(
    request: FastifyRequest<{ Params: { roleId: string } }>,
    reply: FastifyReply,
  ) {
    const updatedBy = (request.session as any)?.user?.id;
    const { roleId } = request.params;
    const body = BulkUpdatePermissionBodySchema.parse(request.body);

    const record = await this.roleService.bulkUpdatePermissions(roleId, body, updatedBy);
    return reply.send(record);
  }
}
