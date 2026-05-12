import fp from 'fastify-plugin';

import { CompaniesRepository } from '@/modules/companies/companies.repository.js';
import { StorageRepository } from '@/modules/storage/storage.repository.js';

export default fp(
  async (fastify) => {
    const storageRepository = new StorageRepository(fastify.prisma);
    const companiesRepository = new CompaniesRepository(fastify.prisma);

    fastify.decorate('storageRepository', storageRepository);

    fastify.decorate('companiesRepository', companiesRepository);

    fastify.log.info('PRISMA EN REPOSITORIES: ' + fastify.prisma);

    fastify.log.info('Repositories ready');

    fastify.log.info('PRISMA EN REPOSITORIES: ' + Object.keys(fastify.prisma));
  },

  { name: 'repositories', dependencies: ['prisma'] },
);

declare module 'fastify' {
  interface FastifyInstance {
    storageRepository: StorageRepository;
    companiesRepository: CompaniesRepository;
  }
}
