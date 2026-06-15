import fp from 'fastify-plugin';

import { AuthService } from '@/modules/auth/auth.service.js';

export default fp(
  async (fastify) => {
    const authService = new AuthService(fastify.prisma, fastify.log);

    fastify.decorate('authService', authService);
  },
  {
    name: 'auth-service',
    dependencies: ['prisma', 'config'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthService;
  }
}
