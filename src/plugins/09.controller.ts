import fp from 'fastify-plugin';

import { CompaniesController } from '@/modules/companies/companies.controller.js';
import { ModuleController } from '@/modules/module/module.controller.js';
import { RoleController } from '@/modules/rbac/rbac.controller.js';
import { TeamController } from '@/modules/team/team.controller.js';
import { UsersController } from '@/modules/users/users.controller.js';

export default fp(
  async (fastify) => {
    const companiesController = new CompaniesController(fastify.companiesService);
    const teamController = new TeamController(fastify.teamService);
    const roleController = new RoleController(fastify.roleService);
    const moduleController = new ModuleController(fastify.moduleService);
    const usersController = new UsersController(fastify.usersService);

    fastify.decorate('companiesController', companiesController);
    fastify.decorate('teamController', teamController);
    fastify.decorate('roleController', roleController);
    fastify.decorate('moduleController', moduleController);
    fastify.decorate('usersController', usersController);

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
    teamController: TeamController;
    roleController: RoleController;
    moduleController: ModuleController;
    usersController: UsersController;
  }
}
