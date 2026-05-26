import { FastifyInstance } from 'fastify';

import {
  BulkCreateModuleBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  CreateModuleBodySchema,
  GetListQuery,
  GetModulesQuerySchema,
  ModuleKeyParamsSchema,
  ModuleResponseSchema,
  ModulesListResponseSchema,
  ResponseListSchema,
  UpdateModuleBodySchema,
} from '@/modules/module/module.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function moduleRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.moduleController, {
    tags: ['Modules'],

    schemas: {
      // Parámetros
      idParams: ModuleKeyParamsSchema,

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
