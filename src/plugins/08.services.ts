import fp from 'fastify-plugin';

import { CompaniesService } from '@/modules/companies/companies.service.js';
import { EmailService } from '@/modules/email/email.service.js';
import { ModuleService } from '@/modules/module/modules.service.js';
import { RoleService } from '@/modules/rbac/rbac.service.js';
import { StorageService } from '@/modules/storage/storage.service.js';
import { TeamService } from '@/modules/team/team.service.js';
import { UsersService } from '@/modules/users/users.service.js';

export default fp(
  async (fastify) => {
    const emailService = new EmailService(fastify.prisma, fastify.log);
    const storageService = new StorageService(fastify.storageRepository, fastify.storageProvider);
    const comparyService = new CompaniesService(fastify.companiesRepository);
    const teamService = new TeamService(fastify.teamRepository, fastify.teamUserRepository);
    const roleService = new RoleService(
      fastify.roleRepository,
      fastify.rolePermissionRepository,
      fastify.roleAssignmentRepository,
    );
    const moduleService = new ModuleService(fastify.moduleRepository);
    const usersService = new UsersService(
      fastify.usersRepository,
      fastify.sessionRepository,
      fastify.auth,
    );

    fastify.decorate('emailService', emailService);
    fastify.decorate('storageService', storageService);
    fastify.decorate('companiesService', comparyService);
    fastify.decorate('usersService', usersService);
    fastify.decorate('teamService', teamService);
    fastify.decorate('roleService', roleService);
    fastify.decorate('moduleService', moduleService);

    fastify.log.info('Domain Services ready');
  },
  {
    name: 'services',
    dependencies: ['prisma', 'config', 'storageProvider', 'better-auth'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    emailService: EmailService;
    storageService: StorageService;
    companiesService: CompaniesService;
    usersService: UsersService;
    roleService: RoleService;
    teamService: TeamService;
    moduleService: ModuleService;
  }
}
