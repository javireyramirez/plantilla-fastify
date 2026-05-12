import fp from 'fastify-plugin';

import { AuthService } from '@/modules/auth/auth.service.js';
import { CompaniesService } from '@/modules/companies/companies.service.js';
import { EmailService } from '@/modules/email/email.service.js';
import { StorageService } from '@/modules/storage/storage.service.js';

export default fp(
  async (fastify) => {
    const emailService = new EmailService(fastify.prisma, fastify.log);
    const authService = new AuthService(fastify.prisma, fastify.log);
    const storageService = new StorageService(fastify.storageRepository, fastify.storageProvider);
    const comparyService = new CompaniesService(fastify.companiesRepository);

    fastify.decorate('emailService', emailService);
    fastify.decorate('authService', authService);
    fastify.decorate('storageService', storageService);
    fastify.decorate('companiesService', comparyService);

    fastify.log.info('Services ready');
    fastify.log.info('company service' + comparyService);
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
    companiesService: CompaniesService;
  }
}
