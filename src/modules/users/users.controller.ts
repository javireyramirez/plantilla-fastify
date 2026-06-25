import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import {
  BulkIdsBodySchema,
  UpdateUserRolesBodySchema,
  UpdateUserTeamsBodySchema,
  Users,
  UsersIdParamsSchema,
} from '@/modules/users/users.schema.js';
import { UsersService } from '@/modules/users/users.service.js';
import { HttpError } from '@/utils/http.error.js';
import { parsePagination } from '@/utils/pagination.js';

export class UsersController extends BaseController<Users> {
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }

  // ==========================================
  // POST /users/:id/resend-invitation
  // ==========================================

  async resendInvitation(req: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(req.params);
    await this.usersService.resendInvitation(id);
    return reply.send({ message: 'Invitación reenviada correctamente' });
  }

  // ==========================================
  // POST /users/:id/suspend
  // ==========================================

  async suspend(req: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(req.params);

    if (req.session?.userId === id) {
      throw new HttpError(400, 'No puedes suspender tu propia cuenta');
    }

    const user = await this.usersService.suspend(id);
    return reply.send(user);
  }

  // ==========================================
  // POST /users/:id/unsuspend
  // ==========================================

  async unsuspend(req: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(req.params);
    const user = await this.usersService.unsuspend(id);
    return reply.send(user);
  }

  // ==========================================
  // POST /users/bulk/suspend
  // ==========================================

  async bulkSuspend(req: FastifyRequest, reply: FastifyReply) {
    const { ids } = BulkIdsBodySchema.parse(req.body);
    const requesterId = req.session?.userId!;
    const result = await this.usersService.suspendMany(ids, requesterId);
    return reply.send(result);
  }

  // ==========================================
  // POST /users/bulk/unsuspend
  // ==========================================

  async bulkUnsuspend(req: FastifyRequest, reply: FastifyReply) {
    const { ids } = BulkIdsBodySchema.parse(req.body);
    const result = await this.usersService.unsuspendMany(ids);
    return reply.send(result);
  }

  // ==========================================
  // GET /users/:id/roles
  // ==========================================
  async getRoleAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(request.params);
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = request.query as any;

    const { skip, take, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    // Pasamos el skip y take para la paginación de la tabla
    const result = await this.usersService.getRoleAssignments(id, { skip, take });

    return reply.send({
      data: result.data,
      meta: meta(result.total),
    });
  }

  // ==========================================
  // POST /users/:id/roles
  // ==========================================
  async addRoleAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(request.params);
    const { roles } = UpdateUserRolesBodySchema.parse(request.body);
    const requesterId = request.session?.userId!;

    const result = await this.usersService.addRoleAssignments(id, roles, requesterId);
    return reply.send(result);
  }

  // ==========================================
  // DELETE /users/:id/roles
  // ==========================================
  async removeRoleAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(request.params);
    const { roles } = UpdateUserRolesBodySchema.parse(request.body);

    const result = await this.usersService.removeRoleAssignments(id, roles);
    return reply.send(result); // Devuelve { count: number }
  }

  // ==========================================
  // GET /users/:id/teams
  // ==========================================
  async getTeamAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(request.params);
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = request.query as any;

    const { skip, take, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.usersService.getTeamAssignments(id, { skip, take });

    return reply.send({
      data: result.data,
      meta: meta(result.total),
    });
  }

  // ==========================================
  // POST /users/:id/teams
  // ==========================================
  async addTeamAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(request.params);
    const { teams } = UpdateUserTeamsBodySchema.parse(request.body);
    const requesterId = request.session?.userId!;

    const result = await this.usersService.addTeamAssignments(id, teams, requesterId);
    return reply.send(result);
  }

  // ==========================================
  // DELETE /users/:id/teams
  // ==========================================
  async removeTeamAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(request.params);
    const { teams } = UpdateUserTeamsBodySchema.parse(request.body);

    const result = await this.usersService.removeTeamAssignments(id, teams);
    return reply.send(result);
  }
}
