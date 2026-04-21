import { type BetterAuthOptions, betterAuth } from 'better-auth';
import type { Auth } from 'better-auth';
import fp from 'fastify-plugin';

import { createAuth } from '@/config/auth/auth.js';

export default fp(
  async (fastify) => {
    const auth = createAuth(fastify.authService) as unknown as Auth<BetterAuthOptions>;
    fastify.decorate('auth', auth);
    fastify.log.info('Better Auth ready');
  },
  {
    name: 'better-auth',
    dependencies: ['config', 'services'],
  },
);

type BetterAuthInstance = Auth<BetterAuthOptions>;
type Session = Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>;

declare module 'fastify' {
  interface FastifyInstance {
    auth: BetterAuthInstance;
  }
  interface FastifyRequest {
    session: Session;
  }
}
