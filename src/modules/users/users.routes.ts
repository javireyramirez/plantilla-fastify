import { PermissionAction } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { requirePermission } from '@/hooks/rbac.js';
import { requireAuth } from '@/hooks/require.auth.js';
import { userContext } from '@/hooks/user.context.js';
import {
  BulkIdsBodySchema,
  BulkResponseSchema,
  CreateUsersBodySchema,
  GetListQuery,
  GetUsersQuerySchema,
  ResponseListSchema,
  ResponseMessageSchema,
  UpdateUserAssignmentsBodySchema,
  UpdateUsersBodySchema,
  UserAssignmentsResponseSchema,
  UsersIdParamsSchema,
  UsersListResponseSchema,
  UsersResponseSchema,
} from '@/modules/users/users.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const ctrl = fastify.usersController;
  const preHandler = [requireAuth, userContext, requirePermission('users', PermissionAction.READ)];

  registerBaseRoutes(fastify, ctrl, {
    resource: 'users',
    tags: ['Users'],
    schemas: {
      idParams: UsersIdParamsSchema,
      getManyQuery: GetUsersQuerySchema,
      GetListQuery: GetListQuery,
      createBody: CreateUsersBodySchema,
      updateBody: UpdateUsersBodySchema,
      bulkIdsBody: BulkIdsBodySchema,
      getManyResponse: UsersListResponseSchema,
      getOneResponse: UsersResponseSchema,
      createResponse: UsersResponseSchema,
      updateResponse: UsersResponseSchema,
      deleteResponse: UsersResponseSchema,
      restoreResponse: UsersResponseSchema,
      bulkResponse: BulkResponseSchema,
      getListResponse: ResponseListSchema,
    },
  });

  // ==========================================
  // POST /users/:id/resend-invitation
  // ==========================================

  app.post('/:id/resend-invitation', {
    schema: {
      tags: ['Users'],
      params: UsersIdParamsSchema,
      response: { 200: ResponseMessageSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.CREATE)],
    handler: ctrl.resendInvitation.bind(ctrl),
  });

  // ==========================================
  // POST /users/:id/suspend
  // ==========================================

  app.post('/:id/suspend', {
    schema: {
      tags: ['Users'],
      params: UsersIdParamsSchema,
      response: { 200: UsersResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.UPDATE)],
    handler: ctrl.suspend.bind(ctrl),
  });

  // ==========================================
  // POST /users/:id/unsuspend
  // ==========================================

  app.post('/:id/unsuspend', {
    schema: {
      tags: ['Users'],
      params: UsersIdParamsSchema,
      response: { 200: UsersResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.UPDATE)],
    handler: ctrl.unsuspend.bind(ctrl),
  });

  // ==========================================
  // POST /users/bulk/suspend
  // ==========================================

  app.post('/bulk/suspend', {
    schema: {
      tags: ['Users'],
      body: BulkIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.UPDATE)],
    handler: ctrl.bulkSuspend.bind(ctrl),
  });

  // ==========================================
  // POST /users/bulk/unsuspend
  // ==========================================

  app.post('/bulk/unsuspend', {
    schema: {
      tags: ['Users'],
      body: BulkIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.UPDATE)],
    handler: ctrl.bulkUnsuspend.bind(ctrl),
  });

  // ==========================================
  // GET /users/:id/assignments
  // ==========================================

  app.get('/:id/assignments', {
    schema: {
      tags: ['User Assignments'],
      params: UsersIdParamsSchema,
      response: { 200: UserAssignmentsResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.READ)],
    handler: ctrl.getAssignments.bind(ctrl),
  });

  // ==========================================
  // POST /users/:id/assignments
  // ==========================================

  app.post('/:id/assignments', {
    schema: {
      tags: ['User Assignments'],
      params: UsersIdParamsSchema,
      body: UpdateUserAssignmentsBodySchema,
      response: { 200: UserAssignmentsResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.SETTINGS)],
    handler: ctrl.addAssignments.bind(ctrl),
  });

  // ==========================================
  // DELETE /users/:id/assignments
  // ==========================================

  app.delete('/:id/assignments', {
    schema: {
      tags: ['User Assignments'],
      params: UsersIdParamsSchema,
      body: UpdateUserAssignmentsBodySchema,
      response: { 200: UserAssignmentsResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('users', PermissionAction.SETTINGS)],
    handler: ctrl.removeAssignments.bind(ctrl),
  });
}
