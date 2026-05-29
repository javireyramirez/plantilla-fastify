import { PermissionAction } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { memberContext } from '@/hooks/member.context.js';
import { requirePermission } from '@/hooks/rbac.js';
import { requireAuth } from '@/hooks/require.auth.js';
import {
  BulkCreateTeamBodySchema,
  BulkIdsBodySchema,
  BulkMemberIdsBodySchema,
  BulkResponseSchema,
  CreateTeamBodySchema,
  CreateTeamMemberSchema,
  GetListQuery,
  GetTeamMembersQuerySchema,
  GetTeamQuerySchema,
  ResponseListSchema,
  TeamIdParamsSchema,
  TeamListResponseSchema,
  TeamMemberIdParamsSchema,
  TeamMemberListResponseSchema,
  TeamMemberResponseSchema,
  TeamResponseSchema,
  UpdateTeamBodySchema,
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

  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', memberContext);
  requirePermission('teams', PermissionAction.SETTINGS);

  // ==========================================
  // 1. LECTURA
  // ==========================================

  app.get('/:id/members', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      querystring: GetTeamMembersQuerySchema,
      response: { 200: TeamMemberListResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('teams', PermissionAction.READ)],
    handler: fastify.teamController.getAllMembers.bind(fastify.teamController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  app.post('/:id/members', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      body: CreateTeamMemberSchema,
      response: { 201: TeamMemberResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.addMember.bind(fastify.teamController),
  });

  app.delete('/:id/members/:memberId', {
    schema: {
      tags: ['Team Members'],
      params: TeamMemberIdParamsSchema,
      response: { 200: TeamMemberResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.removeMember.bind(fastify.teamController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================
  app.post('/:id/members/bulk', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      body: BulkMemberIdsBodySchema,
      response: { 201: BulkResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.addMembers.bind(fastify.teamController),
  });

  app.delete('/:id/members/bulk', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      body: BulkMemberIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('teams', PermissionAction.SETTINGS)],
    handler: fastify.teamController.removeMembers.bind(fastify.teamController),
  });
}
