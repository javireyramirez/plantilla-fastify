import fp from 'fastify-plugin';

import { StorageRepository } from '@/modules/storage/storage.repository.js';

export default fp(
  async (fastify) => {
    const storageRepository = new StorageRepository(fastify.prisma);

    fastify.decorate('storageRepository', storageRepository);
  },
  { name: 'repositories', dependencies: ['prisma'] },
);

declare module 'fastify' {
  interface FastifyInstance {
    storageRepository: StorageRepository;
  }
}
