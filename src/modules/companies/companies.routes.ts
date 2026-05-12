import { FastifyInstance } from 'fastify';

// Ajusta el path según tu proyecto
import {
  BulkCreateCompanyBodySchema,
  // Importar estos nuevos
  BulkIdsBodySchema,
  BulkResponseSchema,
  CompaniesListResponseSchema,
  CompanyDeletedResponseSchema,
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
      // --- Individuales ---
      idParams: CompanyIdParamsSchema,
      getManyQuery: GetCompaniesQuerySchema,
      createBody: CreateCompanyBodySchema,
      updateBody: UpdateCompanyBodySchema,

      // --- Masivos (Bulk) - ESTOS FALTABAN ---
      bulkCreateBody: BulkCreateCompanyBodySchema,
      bulkIdsBody: BulkIdsBodySchema,
      bulkResponse: BulkResponseSchema,

      // --- Respuestas ---
      getManyResponse: CompaniesListResponseSchema,
      getOneResponse: CompanyResponseSchema,
      createResponse: CompanyResponseSchema,
      updateResponse: CompanyResponseSchema,
      deleteResponse: CompanyResponseSchema,
      restoreResponse: CompanyResponseSchema,
    },
  });
}
