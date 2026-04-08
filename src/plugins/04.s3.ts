import { S3Client } from '@aws-sdk/client-s3';
import fp from 'fastify-plugin';

import { env } from '@/config/env.js';
import { S3Provider } from '@/modules/storage/s3.provider.js';
import type { IStorageProvider } from '@/modules/storage/storage.provider.interface.js';

declare module 'fastify' {
  interface FastifyInstance {
    storageProvider: IStorageProvider; // ✅ interfaz, no S3Client
  }
}

export default fp(
  async (fastify) => {
    const client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    const provider = new S3Provider(client, fastify.config.S3_BUCKET_NAME);
    fastify.decorate('storageProvider', provider);

    fastify.addHook('onClose', async () => {
      fastify.log.info('Cerrando cliente S3...');
      client.destroy();
    });
  },
  {
    name: 'storageProvider',
    dependencies: ['config'],
  },
);
