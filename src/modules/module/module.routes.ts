import { FastifyInstance } from 'fastify';

import {
  BulkCreateModuleBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  CreateModuleBodySchema,
  GetListQuery,
  GetModulesQuerySchema,
  ModuleParamsSchema,
  ModuleResponseSchema,
  ModulesListResponseSchema,
  ResponseListSchema,
  UpdateModuleBodySchema,
} from '@/modules/module/module.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function moduleRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.moduleController, {
    resource: 'modules',
    tags: ['Modules'],

    auth: {
      skipUserContext: true,
      skipPermissions: true,
      requireSuperAdmin: true,
    },

    schemas: {
      // Parámetros
      idParams: ModuleParamsSchema,

      // Query
      getManyQuery: GetModulesQuerySchema,
      GetListQuery: GetListQuery,

      // Body
      createBody: CreateModuleBodySchema,
      updateBody: UpdateModuleBodySchema,
      bulkCreateBody: BulkCreateModuleBodySchema,
      bulkIdsBody: BulkIdsBodySchema,

      // Respuestas
      getManyResponse: ModulesListResponseSchema,
      getOneResponse: ModuleResponseSchema,
      createResponse: ModuleResponseSchema,
      updateResponse: ModuleResponseSchema,
      deleteResponse: ModuleResponseSchema,
      restoreResponse: ModuleResponseSchema,
      bulkResponse: BulkResponseSchema,
      getListResponse: ResponseListSchema,
    },
  });
}
