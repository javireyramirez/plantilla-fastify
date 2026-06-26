import { PermissionAction } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { requirePermission } from '@/hooks/rbac.js';
import { requireAuth } from '@/hooks/require.auth.js';
import { userContext } from '@/hooks/user.context.js';
import {
  BulkCreateTeamBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  BulkuserIdsBodySchema,
  CreateTeamBodySchema,
  CreateTeamUserSchema,
  GetListQuery,
  GetTeamAssignmentsQuerySchema,
  GetTeamQuerySchema,
  GetTeamUsersQuerySchema,
  ResponseListSchema,
  TeamIdParamsSchema,
  TeamListResponseSchema,
  TeamResponseSchema,
  TeamRolesPaginatedResponseSchema,
  TeamUserListResponseSchema,
  TeamUserResponseSchema,
  TeamuserIdParamsSchema,
  UpdateTeamBodySchema,
  UpdateTeamRolesBodySchema,
} from '@/modules/team/team.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function teamRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  registerBaseRoutes(fastify, fastify.teamController, {
    resource: 'teams',
    tags: ['Team'],
    schemas: {
      // Parámetros
      idParams: TeamIdParamsSchema,
      // Query
      getManyQuery: GetTeamQuerySchema,
      GetListQuery: GetListQuery,
      // Body
      createBody: CreateTeamBodySchema,
      updateBody: UpdateTeamBodySchema,
      bulkCreateBody: BulkCreateTeamBodySchema,
      bulkIdsBody: BulkIdsBodySchema,
      // Respuestas
      getManyResponse: TeamListResponseSchema,
      getOneResponse: TeamResponseSchema,
      createResponse: TeamResponseSchema,
      updateResponse: TeamResponseSchema,
      deleteResponse: TeamResponseSchema,
      restoreResponse: TeamResponseSchema,
      bulkResponse: BulkResponseSchema,
      getListResponse: ResponseListSchema,
    },
  });

  // ==========================================
  // 1. LECTURA
  // ==========================================

  app.get('/:id/users', {
    schema: {
      tags: ['Team Users'],
      params: TeamIdParamsSchema,
      querystring: GetTeamUsersQuerySchema,
      response: { 200: TeamUserListResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.READ)],
    handler: fastify.teamController.getAllUsers.bind(fastify.teamController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  app.post('/:id/users', {
    schema: {
      tags: ['Team Users'],
      params: TeamIdParamsSchema,
      body: CreateTeamUserSchema,
      response: { 201: TeamUserResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.addUser.bind(fastify.teamController),
  });

  app.delete('/:id/users/:userId', {
    schema: {
      tags: ['Team Users'],
      params: TeamuserIdParamsSchema,
      response: { 200: TeamUserResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.removeUser.bind(fastify.teamController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================
  app.post('/:id/users/bulk', {
    schema: {
      tags: ['Team Users'],
      params: TeamIdParamsSchema,
      body: BulkuserIdsBodySchema,
      response: { 201: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.addUsers.bind(fastify.teamController),
  });

  app.delete('/:id/users/bulk', {
    schema: {
      tags: ['Team Users'],
      params: TeamIdParamsSchema,
      body: BulkuserIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.removeUsers.bind(fastify.teamController),
  });

  // ==========================================
  // ROLES ASSIGNMENTS ROUTES
  // ==========================================

  app.get('/:id/roles', {
    schema: {
      tags: ['Team Roles'],
      params: TeamIdParamsSchema,
      querystring: GetTeamAssignmentsQuerySchema,
      response: { 200: TeamRolesPaginatedResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.teamController.getRoleAssignments.bind(fastify.teamController),
  });

  app.post('/:id/roles', {
    schema: {
      tags: ['Team Roles'],
      params: TeamIdParamsSchema,
      body: UpdateTeamRolesBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.teamController.addRoleAssignments.bind(fastify.teamController),
  });

  app.delete('/:id/roles', {
    schema: {
      tags: ['Team Roles'],
      params: TeamIdParamsSchema,
      body: UpdateTeamRolesBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, userContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.teamController.removeRoleAssignments.bind(fastify.teamController),
  });
}
