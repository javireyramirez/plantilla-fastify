import fp from 'fastify-plugin';

import { CompaniesRepository } from '@/modules/companies/companies.repository.js';
import { OrganizationMemberRepository } from '@/modules/organization/organization-member.repository.js';
import { OrganizationRepository } from '@/modules/organization/organization.repository.js';
import { StorageRepository } from '@/modules/storage/storage.repository.js';

export default fp(
  async (fastify) => {
    const storageRepository = new StorageRepository(fastify.prisma);
    const companiesRepository = new CompaniesRepository(fastify.prisma);
    const organizationRepository = new OrganizationRepository(fastify.prisma);
    const organizationMemberRepository = new OrganizationMemberRepository(fastify.prisma);

    fastify.decorate('storageRepository', storageRepository);

    fastify.decorate('companiesRepository', companiesRepository);

    fastify.decorate('organizationRepository', organizationRepository);

    fastify.decorate('organizationMemberRepository', organizationMemberRepository);

    fastify.log.info('Repositories ready');
  },

  { name: 'repositories', dependencies: ['prisma'] },
);

declare module 'fastify' {
  interface FastifyInstance {
    storageRepository: StorageRepository;
    companiesRepository: CompaniesRepository;
    organizationRepository: OrganizationRepository;
    organizationMemberRepository: OrganizationMemberRepository;
  }
}
