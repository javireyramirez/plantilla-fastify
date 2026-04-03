import { betterAuth } from 'better-auth';
import { toNodeHandler } from 'better-auth/node';
import fp from 'fastify-plugin';

import { auth } from '@/config/auth/auth.js';
import { env } from '@/config/env.js';

export default fp(
  async (fastify) => {
    fastify.decorate('auth', auth as any);

    fastify.log.info('Better Auth ready');
  },
  {
    name: 'better-auth',
    dependencies: ['config', 'prisma'],
  },
);

type BetterAuthInstance = ReturnType<typeof betterAuth>;
type Session = Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>;

declare module 'fastify' {
  interface FastifyInstance {
    auth: BetterAuthInstance;
  }
  interface FastifyRequest {
    session: Session;
  }
}
