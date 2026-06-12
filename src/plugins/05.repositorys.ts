import fp from 'fastify-plugin';

import { CompaniesRepository } from '@/modules/companies/companies.repository.js';
import { ModuleRepository } from '@/modules/module/module.repository.js';
import { RoleAssignmentRepository } from '@/modules/rbac/role-assignment.repository.js';
import { RolePermissionRepository } from '@/modules/rbac/role-permission.repository.js';
import { RoleRepository } from '@/modules/rbac/role.repository.js';
import { StorageRepository } from '@/modules/storage/storage.repository.js';
import { TeamMemberRepository } from '@/modules/team/team-member.repository.js';
import { TeamRepository } from '@/modules/team/team.repository.js';

export default fp(
  async (fastify) => {
    const storageRepository = new StorageRepository(fastify.prisma);
    const companiesRepository = new CompaniesRepository(fastify.prisma);

    const roleRepository = new RoleRepository(fastify.prisma);
    const rolePermissionRepository = new RolePermissionRepository(fastify.prisma);
    const teamRepository = new TeamRepository(fastify.prisma);
    const teamMemberRepository = new TeamMemberRepository(fastify.prisma);
    const roleAssignmentRepository = new RoleAssignmentRepository(fastify.prisma);
    const moduleRepository = new ModuleRepository(fastify.prisma);

    fastify.decorate('storageRepository', storageRepository);
    fastify.decorate('companiesRepository', companiesRepository);

    fastify.decorate('roleRepository', roleRepository);
    fastify.decorate('rolePermissionRepository', rolePermissionRepository);
    fastify.decorate('roleAssignmentRepository', roleAssignmentRepository);
    fastify.decorate('teamRepository', teamRepository);
    fastify.decorate('teamMemberRepository', teamMemberRepository);
    fastify.decorate('moduleRepository', moduleRepository);

    fastify.log.info('Repositories ready');
  },

  { name: 'repositories', dependencies: ['prisma'] },
);

declare module 'fastify' {
  interface FastifyInstance {
    storageRepository: StorageRepository;
    companiesRepository: CompaniesRepository;
    roleRepository: RoleRepository;
    rolePermissionRepository: RolePermissionRepository;
    teamRepository: TeamRepository;
    teamMemberRepository: TeamMemberRepository;
    roleAssignmentRepository: RoleAssignmentRepository;
    moduleRepository: ModuleRepository;
  }
}
