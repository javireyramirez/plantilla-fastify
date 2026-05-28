import { FastifyInstance } from 'fastify';

import { requireAuth } from '@/hooks/require.auth.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

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

export default async function teamRoutes(fastify: FastifyInstance) {
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

  // ==========================================
  // 1. LECTURA
  // ==========================================

  fastify.get('/:id/members', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      querystring: GetTeamMembersQuerySchema,
      response: { 200: TeamMemberListResponseSchema },
    },
    handler: fastify.teamController.getAllMembers.bind(fastify.teamController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  fastify.post('/:id/members', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      body: CreateTeamMemberSchema,
      response: { 201: TeamMemberResponseSchema },
    },
    handler: fastify.teamController.addMember.bind(fastify.teamController),
  });

  fastify.delete('/:id/members/:memberId', {
    schema: {
      tags: ['Team Members'],
      params: TeamMemberIdParamsSchema,
      response: { 200: TeamMemberResponseSchema },
    },
    handler: fastify.teamController.removeMember.bind(fastify.teamController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  fastify.post('/:id/members/bulk', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      body: BulkMemberIdsBodySchema,
      response: { 201: BulkResponseSchema },
    },
    handler: fastify.teamController.addMembers.bind(fastify.teamController),
  });

  fastify.delete('/:id/members/bulk', {
    schema: {
      tags: ['Team Members'],
      params: TeamIdParamsSchema,
      body: BulkMemberIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    handler: fastify.teamController.removeMembers.bind(fastify.teamController),
  });
}
