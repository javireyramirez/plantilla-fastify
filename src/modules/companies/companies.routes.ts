import { FastifyInstance } from 'fastify';

import { registerBaseRoutes } from '@/routes/base.routes.js';

import {
  CompaniesListResponseSchema,
  CompanyDeletedResponseSchema,
  CompanyIdParamsSchema,
  CompanyResponseSchema,
  CreateCompanyBodySchema,
  GetCompaniesQuerySchema,
  UpdateCompanyBodySchema,
} from './companies.schema.js';

export default async function companiesRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.companiesController, {
    tags: ['Companies'],

    schemas: {
      idParams: CompanyIdParamsSchema,

      getManyQuery: GetCompaniesQuerySchema,

      createBody: CreateCompanyBodySchema,
      updateBody: UpdateCompanyBodySchema,

      getManyResponse: CompaniesListResponseSchema,

      getOneResponse: CompanyResponseSchema,

      createResponse: CompanyResponseSchema,

      updateResponse: CompanyResponseSchema,

      deleteResponse: CompanyDeletedResponseSchema,

      restoreResponse: CompanyResponseSchema,
    },
  });
}
