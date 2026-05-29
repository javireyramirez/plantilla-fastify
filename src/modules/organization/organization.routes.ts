import { FastifyInstance } from 'fastify';

import { requireAuth } from '@/hooks/require.auth.js';
import {
  BulkCreateOrganizationBodySchema,
  BulkIdsBodySchema,
  BulkMemberIdsBodySchema,
  BulkResponseSchema,
  BulkToggleMemberStatusSchema,
  CreateMemberSchema,
  CreateOrganizationBodySchema,
  GetListQuery,
  GetMembersQuerySchema,
  GetOrganizationQuerySchema,
  MemberListResponseSchema,
  MemberUserIdParamsSchema,
  OrganizationIdParamsSchema,
  OrganizationListResponseSchema,
  OrganizationMemberResponseSchema,
  OrganizationResponseSchema,
  ResponseListSchema,
  ToggleMemberStatusSchema,
  UpdateOrganizationBodySchema,
} from '@/modules/organization/organization.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function organizationRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.organizationController, {
    resource: 'organizations',
    tags: ['Organization'],
    auth: {
      skipMemberContext: true,
      skipPermissions: true,
      requireSuperAdmin: true,
    },
    schemas: {
      // Parámetros
      idParams: OrganizationIdParamsSchema,
      // Query
      getManyQuery: GetOrganizationQuerySchema,
      GetListQuery: GetListQuery,
      // Body
      createBody: CreateOrganizationBodySchema,
      updateBody: UpdateOrganizationBodySchema,
      bulkCreateBody: BulkCreateOrganizationBodySchema,
      bulkIdsBody: BulkIdsBodySchema,
      // Respuestas
      getManyResponse: OrganizationListResponseSchema,
      getOneResponse: OrganizationResponseSchema,
      createResponse: OrganizationResponseSchema,
      updateResponse: OrganizationResponseSchema,
      deleteResponse: OrganizationResponseSchema,
      restoreResponse: OrganizationResponseSchema,
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
      tags: ['Organization Members'],
      params: OrganizationIdParamsSchema,
      querystring: GetMembersQuerySchema,
      response: { 200: MemberListResponseSchema },
    },
    handler: fastify.organizationController.getAllMembers.bind(fastify.organizationController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  fastify.post('/:id/members', {
    schema: {
      tags: ['Organization Members'],
      params: OrganizationIdParamsSchema,
      body: CreateMemberSchema,
      response: { 201: OrganizationMemberResponseSchema },
    },
    handler: fastify.organizationController.addMember.bind(fastify.organizationController),
  });

  fastify.delete('/:id/members/:userId', {
    schema: {
      tags: ['Organization Members'],
      params: MemberUserIdParamsSchema,
      response: { 200: OrganizationMemberResponseSchema },
    },
    handler: fastify.organizationController.removeMember.bind(fastify.organizationController),
  });

  fastify.patch('/:id/members/:userId/status', {
    schema: {
      tags: ['Organization Members'],
      params: MemberUserIdParamsSchema,
      body: ToggleMemberStatusSchema,
      response: { 200: OrganizationMemberResponseSchema },
    },
    handler: fastify.organizationController.toggleMemberStatus.bind(fastify.organizationController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  fastify.post('/:id/members/bulk', {
    schema: {
      tags: ['Organization Members'],
      params: OrganizationIdParamsSchema,
      body: BulkMemberIdsBodySchema,
      response: { 201: BulkResponseSchema },
    },
    handler: fastify.organizationController.addMembers.bind(fastify.organizationController),
  });

  fastify.delete('/:id/members/bulk', {
    schema: {
      tags: ['Organization Members'],
      params: OrganizationIdParamsSchema,
      body: BulkMemberIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    handler: fastify.organizationController.removeMembers.bind(fastify.organizationController),
  });

  fastify.patch('/:id/members/bulk/status', {
    schema: {
      tags: ['Organization Members'],
      params: OrganizationIdParamsSchema,
      body: BulkToggleMemberStatusSchema,
      response: { 200: BulkResponseSchema },
    },
    handler: fastify.organizationController.toggleMembersStatus.bind(
      fastify.organizationController,
    ),
  });
}
