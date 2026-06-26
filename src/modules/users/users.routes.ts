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
  GetUserAssignmentsQuerySchema,
  GetUsersQuerySchema,
  ResponseListSchema,
  ResponseMessageSchema,
  UpdateUserRolesBodySchema,
  UpdateUserTeamsBodySchema,
  UpdateUsersBodySchema,
  UserRolesPaginatedResponseSchema,
  UserTeamsPaginatedResponseSchema,
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
  // ROLES ASSIGNMENTS ROUTES
  // ==========================================

  app.get('/:id/roles', {
    schema: {
      tags: ['User Roles'],
      params: UsersIdParamsSchema,
      querystring: GetUserAssignmentsQuerySchema,
      response: { 200: UserRolesPaginatedResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: ctrl.getRoleAssignments.bind(ctrl),
  });

  app.post('/:id/roles', {
    schema: {
      tags: ['User Roles'],
      params: UsersIdParamsSchema,
      body: UpdateUserRolesBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: ctrl.addRoleAssignments.bind(ctrl),
  });

  app.delete('/:id/roles', {
    schema: {
      tags: ['User Roles'],
      params: UsersIdParamsSchema,
      body: UpdateUserRolesBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: ctrl.removeRoleAssignments.bind(ctrl),
  });

  // ==========================================
  // TEAMS ASSIGNMENTS ROUTES
  // ==========================================

  app.get('/:id/teams', {
    schema: {
      tags: ['User Teams'],
      params: UsersIdParamsSchema,
      querystring: GetUserAssignmentsQuerySchema,
      response: { 200: UserTeamsPaginatedResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: ctrl.getTeamAssignments.bind(ctrl),
  });

  app.post('/:id/teams', {
    schema: {
      tags: ['User Teams'],
      params: UsersIdParamsSchema,
      body: UpdateUserTeamsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: ctrl.addTeamAssignments.bind(ctrl),
  });

  app.delete('/:id/teams', {
    schema: {
      tags: ['User Teams'],
      params: UsersIdParamsSchema,
      body: UpdateUserTeamsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: ctrl.removeTeamAssignments.bind(ctrl),
  });
}
