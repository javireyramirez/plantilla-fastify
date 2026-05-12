import fp from 'fastify-plugin';

import { CompaniesController } from '@/modules/companies/companies.controller.js';

export default fp(
  async (fastify) => {
    const companiesController = new CompaniesController(fastify.companiesService);

    fastify.decorate('companiesController', companiesController);

    fastify.log.info('Controllers ready');
  },
  {
    name: 'controllers',
    dependencies: ['services'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    companiesController: CompaniesController;
  }
}
