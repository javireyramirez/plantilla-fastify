import fp from 'fastify-plugin';

import { AuthService } from '@/modules/auth/auth.service.js';
import { EmailService } from '@/modules/email/email.service.js';

export default fp(
  async (fastify) => {
    const emailService = new EmailService(fastify.prisma, fastify.log);
    const authService = new AuthService(fastify.prisma, fastify.log);

    fastify.decorate('emailService', emailService);
    fastify.decorate('authService', authService);

    fastify.log.info('Services ready');
  },
  {
    name: 'services',
    dependencies: ['prisma', 'config'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    emailService: EmailService;
    authService: AuthService;
  }
}
