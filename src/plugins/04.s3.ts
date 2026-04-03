import { S3Client } from '@aws-sdk/client-s3';
import fp from 'fastify-plugin';

import { s3 } from '@/config/s3.js';

export default fp(
  async (fastify) => {
    fastify.decorate('s3', s3);

    fastify.log.info('S3 ready');

    fastify.addHook('onClose', async () => {
      fastify.log.info('Cerrando cliente S3...');
      s3.destroy();
    });
  },
  {
    name: 's3',
    dependencies: ['config'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
  }
}
