import fp from 'fastify-plugin';

import type { IStorageProvider } from '@/modules/storage/interfaces/storage.provider.interface.js';
import { createStorageProvider } from '@/modules/storage/storage.provider.js';

declare module 'fastify' {
  interface FastifyInstance {
    storageProvider: IStorageProvider;
  }
}

export default fp(
  async (fastify) => {
    const { provider, onClose } = createStorageProvider(fastify.config);

    fastify.decorate('storageProvider', provider);

    fastify.log.info('Storage provider ready');

    if (onClose) {
      fastify.addHook('onClose', async () => {
        fastify.log.info('Cerrando storage provider...');
        await onClose();
      });
    }
  },
  {
    name: 'storageProvider',
    dependencies: ['config'],
  },
);
