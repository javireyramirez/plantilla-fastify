import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';

import { prisma } from '@/config/prisma.js';

export default fp(
  async (fastify) => {
    fastify.decorate('prisma', prisma);

    fastify.log.info('Prisma ready');

    fastify.addHook('onClose', async () => {
      await prisma.$disconnect();
      fastify.log.info('Prisma disconnected');
    });
  },
  {
    name: 'prisma',
    dependencies: ['config'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
