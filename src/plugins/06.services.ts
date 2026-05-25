import fp from 'fastify-plugin';

import { AuthService } from '@/modules/auth/auth.service.js';
import { CompaniesService } from '@/modules/companies/companies.service.js';
import { EmailService } from '@/modules/email/email.service.js';
import { OrganizationService } from '@/modules/organization/organization.service.js';
import { RoleService } from '@/modules/rbac/rbac.service.js';
import { StorageService } from '@/modules/storage/storage.service.js';
import { TeamService } from '@/modules/team/team.service.js';

export default fp(
  async (fastify) => {
    const emailService = new EmailService(fastify.prisma, fastify.log);
    const authService = new AuthService(fastify.prisma, fastify.log);
    const storageService = new StorageService(fastify.storageRepository, fastify.storageProvider);
    const comparyService = new CompaniesService(fastify.companiesRepository);
    const organizationService = new OrganizationService(
      fastify.organizationRepository,
      fastify.organizationMemberRepository,
    );
    const teamService = new TeamService(
      fastify.teamRepository,
      fastify.teamMemberRepository,
      fastify.organizationMemberRepository,
    );
    const roleService = new RoleService(
      fastify.roleRepository,
      fastify.rolePermissionRepository,
      fastify.roleAssignmentRepository,
    );

    fastify.decorate('emailService', emailService);
    fastify.decorate('authService', authService);
    fastify.decorate('storageService', storageService);
    fastify.decorate('companiesService', comparyService);
    fastify.decorate('organizationService', organizationService);
    fastify.decorate('teamService', teamService);
    fastify.decorate('roleService', roleService);

    fastify.log.info('Services ready');
  },
  {
    name: 'services',
    dependencies: ['prisma', 'config', 'storageProvider'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    emailService: EmailService;
    authService: AuthService;
    storageService: StorageService;
    companiesService: CompaniesService;
    organizationService: OrganizationService;
    roleService: RoleService;
    teamService: TeamService;
  }
}
