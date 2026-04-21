import fp from 'fastify-plugin';

import { AuthService } from '@/modules/auth/auth.service.js';
import { EmailService } from '@/modules/email/email.service.js';
import { StorageService } from '@/modules/storage/storage.service.js';

export default fp(
  async (fastify) => {
    const emailService = new EmailService(fastify.prisma, fastify.log);
    const authService = new AuthService(fastify.prisma, fastify.log);
    const storageService = new StorageService(fastify.prisma, fastify.storageProvider);

    fastify.decorate('emailService', emailService);
    fastify.decorate('authService', authService);
    fastify.decorate('storageService', storageService);

    fastify.log.info('Services ready');
  },
  {
    name: 'services',
    dependencies: ['prisma', 'config', 'storageProvider'],
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    emailService: EmailService;
    authService: AuthService;
    storageService: StorageService;
  }
}
