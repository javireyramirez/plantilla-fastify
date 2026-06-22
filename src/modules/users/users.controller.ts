import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import {
  BulkIdsBodySchema,
  UpdateUserAssignmentsBodySchema,
  Users,
  UsersIdParamsSchema,
} from '@/modules/users/users.schema.js';
import { UsersService } from '@/modules/users/users.service.js';
import { HttpError } from '@/utils/http.error.js';

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
  // GET /users/:id/assignments
  // ==========================================

  async getAssignments(req: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(req.params);
    const result = await this.usersService.getAssignments(id);
    return reply.send(result);
  }

  // ==========================================
  // POST /users/:id/assignments
  // ==========================================

  async addAssignments(req: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(req.params);
    const body = UpdateUserAssignmentsBodySchema.parse(req.body);
    const requesterId = req.session?.userId!;
    const result = await this.usersService.addAssignments(id, body, requesterId);
    return reply.send(result);
  }

  // ==========================================
  // DELETE /users/:id/assignments
  // ==========================================

  async removeAssignments(req: FastifyRequest, reply: FastifyReply) {
    const { id } = UsersIdParamsSchema.parse(req.params);
    const body = UpdateUserAssignmentsBodySchema.parse(req.body);
    const result = await this.usersService.removeAssignments(id, body);
    return reply.send(result);
  }
}
