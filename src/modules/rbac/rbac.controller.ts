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
  PermissionScopeParamsSchema,
} from './rbac.schema.js';
import { RoleService } from './rbac.service.js';

export class RoleController extends BaseController<any> {
  constructor(private readonly roleService: RoleService) {
    super(roleService);
  }

  // Extrae los equipos del contexto si los necesitas para filtrar asignaciones
  private getTeamIds(request: any): string[] | undefined {
    return request.userContext?.teamIds;
  }

  // ==========================================
  // OVERRIDES DE BASE
  // ==========================================

  override async getAll(request: FastifyRequest, reply: FastifyReply) {
    const {
      page = 1,
      limit = 10,
      isTrash = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...filters
    } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    // CORREGIDO: Eliminado el parámetro 'scope' ya que los roles son globales
    const result = await this.roleService.findManyWithCount({
      where: this.roleService.getAuditWhere(String(isTrash) === 'true', filters),
      skip,
      take,
      orderBy,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  override async getList(request: FastifyRequest, reply: FastifyReply) {
    const { limit = 20, sortBy = 'name', sortOrder = 'asc', ...filters } = request.query as any;

    // CORREGIDO: Eliminado el parámetro 'scope'
    const result = await this.roleService.findList({
      where: { ...filters },
      take: Number(limit),
      orderBy: { [sortBy]: sortOrder },
    });

    return reply.send(result);
  }

  // ==========================================
  // PERMISOS — LECTURA
  // ==========================================

  async getAllPermissions(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    // CORREGIDO: Eliminado 'teamIds' ya que la lectura de permisos de un rol no se filtra por equipo
    const result = await this.roleService.getPermissionsWithCount(roleId, {
      skip,
      take,
      orderBy,
      ...filters,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // PERMISOS — INDIVIDUALES
  // ==========================================

  async addPermission(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const body = CreatePermissionBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.addPermission(roleId, body, this.getUserId(request));

    return reply.code(201).send(record);
  }

  async revokePermission(request: FastifyRequest, reply: FastifyReply) {
    const { id, roleId } = request.params as any;

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.revokePermission(id, roleId);

    return reply.send(record);
  }

  async updatePermissionScope(request: FastifyRequest, reply: FastifyReply) {
    const { id, roleId } = request.params as any;
    const newScope = PermissionScopeParamsSchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)' de los argumentos
    const record = await this.roleService.updatePermissionScope(
      id,
      roleId,
      newScope as any,
      this.getUserId(request)!,
    );

    return reply.send(record);
  }

  // ==========================================
  // PERMISOS — BULK
  // ==========================================

  async bulkAddPermissions(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const body = BulkCreatePermissionBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.bulkAddPermissions(roleId, body, this.getUserId(request));

    return reply.code(201).send(record);
  }

  async bulkRevokePermissions(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const { ids } = BulkAssignmentIdsBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.bulkRevokePermissions(roleId, ids);

    return reply.send(record);
  }

  async bulkUpdatePermissions(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const newScope = BulkUpdatePermissionBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.bulkUpdatePermissions(
      roleId,
      newScope,
      this.getUserId(request)!,
    );

    return reply.send(record);
  }

  // ==========================================
  // ASIGNACIONES — LECTURA
  // ==========================================

  async getAllAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    // AQUÍ SÍ SE MANTIENE: Las asignaciones sí pertenecen a los contextos de los equipos
    const result = await this.roleService.getAssignmentsWithCount(roleId, {
      skip,
      take,
      orderBy,
      teamIds: this.getTeamIds(request),
      ...filters,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  async getAssignmentById(request: FastifyRequest, reply: FastifyReply) {
    const { roleId, id } = request.params as any;

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.getAssignmentById(id, roleId);

    return reply.send(record);
  }

  // ==========================================
  // ASIGNACIONES — INDIVIDUALES
  // ==========================================

  async assign(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const body = CreateAssignmentBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.assign(roleId, body, this.getUserId(request));

    return reply.code(201).send(record);
  }

  async unassign(request: FastifyRequest, reply: FastifyReply) {
    const { roleId, id } = request.params as any;

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.unassign(id, roleId);

    return reply.send(record);
  }

  // ==========================================
  // ASIGNACIONES — BULK
  // ==========================================

  async bulkAssign(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const body = BulkCreateAssignmentBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.bulkAssign(roleId, body, this.getUserId(request));

    return reply.code(201).send(record);
  }

  async bulkUnassign(request: FastifyRequest, reply: FastifyReply) {
    const { roleId } = request.params as any;
    const { ids } = BulkAssignmentIdsBodySchema.parse(request.body);

    // CORREGIDO: Removido 'this.getTeamIds(request)'
    const record = await this.roleService.bulkUnassign(roleId, ids);

    return reply.send(record);
  }
}
