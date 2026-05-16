import { FastifyInstance } from 'fastify';

import {
  BulkCreateCompanyBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  CompaniesListResponseSchema,
  CompanyIdParamsSchema,
  CompanyResponseSchema,
  CreateCompanyBodySchema,
  GetCompaniesQuerySchema,
  UpdateCompanyBodySchema,
} from '@/modules/companies/companies.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function companiesRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.companiesController, {
    tags: ['Companies'],

    schemas: {
      //Parámetros
      idParams: CompanyIdParamsSchema,

      //Query
      getManyQuery: GetCompaniesQuerySchema,

      //Body
      createBody: CreateCompanyBodySchema,
      updateBody: UpdateCompanyBodySchema,
      bulkCreateBody: BulkCreateCompanyBodySchema,
      bulkIdsBody: BulkIdsBodySchema,

      // --- Respuestas ---
      getManyResponse: CompaniesListResponseSchema,
      getOneResponse: CompanyResponseSchema,
      createResponse: CompanyResponseSchema,
      updateResponse: CompanyResponseSchema,
      deleteResponse: CompanyResponseSchema,
      restoreResponse: CompanyResponseSchema,
      bulkResponse: BulkResponseSchema,
    },
  });
}
