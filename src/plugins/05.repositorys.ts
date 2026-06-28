import fp from 'fastify-plugin';

import { CompaniesRepository } from '@/modules/companies/companies.repository.js';
import { ModuleRepository } from '@/modules/module/module.repository.js';
import { RoleAssignmentRepository } from '@/modules/rbac/role-assignment.repository.js';
import { RolePermissionRepository } from '@/modules/rbac/role-permission.repository.js';
import { RoleRepository } from '@/modules/rbac/role.repository.js';
import { StorageRepository } from '@/modules/storage/storage.repository.js';
import { TeamUserRepository } from '@/modules/team/team-user.repository.js';
import { TeamRepository } from '@/modules/team/team.repository.js';
import { SessionRepository } from '@/modules/users/session.repository.js';
import { UsersRepository } from '@/modules/users/users.repository.js';
import { AuditLogRepository } from '@/modules/audit/audit.repository.js';


export default fp(
  async (fastify) => {
    const storageRepository = new StorageRepository(fastify.prisma);
    const companiesRepository = new CompaniesRepository(fastify.prisma);

    const roleRepository = new RoleRepository(fastify.prisma);
    const rolePermissionRepository = new RolePermissionRepository(fastify.prisma);
    const teamRepository = new TeamRepository(fastify.prisma);
    const teamUserRepository = new TeamUserRepository(fastify.prisma);
    const roleAssignmentRepository = new RoleAssignmentRepository(fastify.prisma);
    const moduleRepository = new ModuleRepository(fastify.prisma);
    const usersRepository = new UsersRepository(fastify.prisma);
    const sessionRepository = new SessionRepository(fastify.prisma);
    const auditLogRepository = new AuditLogRepository(fastify.prisma);

    fastify.decorate('storageRepository', storageRepository);
    fastify.decorate('companiesRepository', companiesRepository);

    fastify.decorate('roleRepository', roleRepository);
    fastify.decorate('rolePermissionRepository', rolePermissionRepository);
    fastify.decorate('roleAssignmentRepository', roleAssignmentRepository);
    fastify.decorate('teamRepository', teamRepository);
    fastify.decorate('teamUserRepository', teamUserRepository);
    fastify.decorate('moduleRepository', moduleRepository);
    fastify.decorate('usersRepository', usersRepository);
    fastify.decorate('sessionRepository', sessionRepository);
    fastify.decorate('auditLogRepository', auditLogRepository);

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
    teamUserRepository: TeamUserRepository;
    roleAssignmentRepository: RoleAssignmentRepository;
    moduleRepository: ModuleRepository;
    usersRepository: UsersRepository;
    sessionRepository: SessionRepository;
    auditLogRepository: AuditLogRepository;
  }
}
