import fp from 'fastify-plugin';

import { CompaniesController } from '@/modules/companies/companies.controller.js';
import { OrganizationController } from '@/modules/organization/organization.controller.js';

export default fp(
  async (fastify) => {
    const companiesController = new CompaniesController(fastify.companiesService);
    const organizationController = new OrganizationController(fastify.organizationService);

    fastify.decorate('companiesController', companiesController);
    fastify.decorate('organizationController', organizationController);

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
    organizationController: OrganizationController;
  }
}
