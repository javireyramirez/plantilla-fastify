import { FastifyInstance } from 'fastify';

import {
  BulkCreateOrganizationBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  CreateOrganizationBodySchema,
  GetListQuery,
  GetOrganizationQuerySchema,
  OrganizationIdParamsSchema,
  OrganizationListResponseSchema,
  OrganizationResponseSchema,
  ResponseListSchema,
  UpdateOrganizationBodySchema,
} from '@/modules/organization/organization.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function organizationRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.organizationController, {
    tags: ['Organization'],

    schemas: {
      //Parámetros
      idParams: OrganizationIdParamsSchema,

      //Query
      getManyQuery: GetOrganizationQuerySchema,
      GetListQuery: GetListQuery,

      //Body
      createBody: CreateOrganizationBodySchema,
      updateBody: UpdateOrganizationBodySchema,
      bulkCreateBody: BulkCreateOrganizationBodySchema,
      bulkIdsBody: BulkIdsBodySchema,

      // --- Respuestas ---
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
}
