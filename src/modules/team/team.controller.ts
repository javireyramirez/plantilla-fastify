import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkuserIdsBodySchema,
  CreateTeamUserSchema,
  GetTeamAssignmentsQuerySchema,
  TeamIdParamsSchema,
  UpdateTeamRolesBodySchema,
} from './team.schema.js';
import { TeamService } from './team.service.js';

export class TeamController extends BaseController<any> {
  constructor(private readonly teamService: TeamService) {
    super(teamService);
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.teamService.getUsersWithCount(id, {
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

  async addUser(request: FastifyRequest, reply: FastifyReply) {
    const invitedBy = (request as any).session?.user?.id;
    const { id } = request.params as any;
    const { userId } = CreateTeamUserSchema.parse(request.body);

    const record = await this.teamService.addUser(id, userId, invitedBy);
    return reply.code(201).send(record);
  }

  async removeUser(request: FastifyRequest, reply: FastifyReply) {
    const { id, userId } = request.params as any;

    const record = await this.teamService.removeUser(id, userId);
    return reply.send(record);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async addUsers(request: FastifyRequest, reply: FastifyReply) {
    const invitedBy = (request as any).session?.user?.id;
    const { id } = request.params as any;
    const { userIds } = BulkuserIdsBodySchema.parse(request.body);

    const record = await this.teamService.addUsers(id, userIds, invitedBy);
    return reply.code(201).send(record);
  }

  async removeUsers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { userIds } = BulkuserIdsBodySchema.parse(request.body);

    const record = await this.teamService.removeUsers(id, userIds);
    return reply.send(record);
  }

  // ==========================================
  // GET /teams/:id/roles
  // ==========================================
  async getRoleAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = TeamIdParamsSchema.parse(request.params);
    const { page, limit, sortBy, sortOrder, ...filters } = GetTeamAssignmentsQuerySchema.parse(
      request.query,
    );
    const { skip, take, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.teamService.getRoleAssignments(id, { skip, take, filters });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // POST /teams/:id/roles
  // ==========================================
  async addRoleAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = TeamIdParamsSchema.parse(request.params);
    const { roles } = UpdateTeamRolesBodySchema.parse(request.body);
    const requesterId = (request as any).session?.userId!;

    const result = await this.teamService.addRoleAssignments(id, roles, requesterId);
    return reply.send(result);
  }

  // ==========================================
  // DELETE /teams/:id/roles
  // ==========================================
  async removeRoleAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = TeamIdParamsSchema.parse(request.params);
    const { roles } = UpdateTeamRolesBodySchema.parse(request.body);

    const result = await this.teamService.removeRoleAssignments(id, roles);
    return reply.send(result);
  }
}
