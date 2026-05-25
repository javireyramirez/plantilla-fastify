import fp from 'fastify-plugin';

import { CompaniesController } from '@/modules/companies/companies.controller.js';
import { OrganizationController } from '@/modules/organization/organization.controller.js';
import { RoleController } from '@/modules/rbac/rbac.controller.js';
import { TeamController } from '@/modules/team/team.controller.js';

export default fp(
  async (fastify) => {
    const companiesController = new CompaniesController(fastify.companiesService);
    const organizationController = new OrganizationController(fastify.organizationService);
    const teamController = new TeamController(fastify.teamService);
    const roleController = new RoleController(fastify.roleService);

    fastify.decorate('companiesController', companiesController);
    fastify.decorate('organizationController', organizationController);
    fastify.decorate('teamController', teamController);
    fastify.decorate('roleController', roleController);

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
    teamController: TeamController;
    roleController: RoleController;
  }
}
