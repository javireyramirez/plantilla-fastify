import { PermissionAction } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { memberContext } from '@/hooks/member.context.js';
import { requirePermission } from '@/hooks/rbac.js';
import { requireAuth } from '@/hooks/require.auth.js';
import {
  BulkIdsBodySchema,
  BulkResponseSchema,
  CreateUsersBodySchema,
  GetListQuery,
  GetUsersQuerySchema,
  ResponseListSchema,
  ResponseMessageSchema,
  UpdateUsersBodySchema,
  UsersIdParamsSchema,
  UsersListResponseSchema,
  UsersResponseSchema,
} from '@/modules/users/users.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const ctrl = fastify.usersController;
  const preHandler = [
    requireAuth,
    memberContext,
    requirePermission('users', PermissionAction.READ),
  ];

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
    preHandler: [requireAuth, memberContext, requirePermission('users', PermissionAction.CREATE)],
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
    preHandler: [requireAuth, memberContext, requirePermission('users', PermissionAction.UPDATE)],
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
    preHandler: [requireAuth, memberContext, requirePermission('users', PermissionAction.UPDATE)],
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
    preHandler: [requireAuth, memberContext, requirePermission('users', PermissionAction.UPDATE)],
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
    preHandler: [requireAuth, memberContext, requirePermission('users', PermissionAction.UPDATE)],
    handler: ctrl.bulkUnsuspend.bind(ctrl),
  });
}
