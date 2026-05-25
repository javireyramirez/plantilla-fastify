import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import companiesRoutes from '@/modules/companies/companies.routes.js';
import healthRoutes from '@/modules/health/health.routes.js';
import organizationRoutes from '@/modules/organization/organization.routes.js';
import roleRoutes from '@/modules/rbac/rbac.routes.js';
import storageRoutes from '@/modules/storage/storage.routes.js';
import teamRoutes from '@/modules/team/team.routes.js';
import type { RateLimitTier } from '@/plugins/02.security.js';

declare module 'fastify' {
  interface FastifyInstance {
    rateLimitTiers: RateLimitTier;
  }
}

export default async function routes(fastify: FastifyInstance) {
  fastify.register(healthRoutes, { prefix: `${env.API_PREFIX}/health` });

  fastify.register(storageRoutes, {
    prefix: `${env.API_PREFIX}/storage`,
    config: {
      rateLimit: fastify.rateLimitTiers.api,
    },
  });

  fastify.register(companiesRoutes, {
    prefix: `${env.API_PREFIX}/test-companies`,
  });

  fastify.register(organizationRoutes, {
    prefix: `${env.API_PREFIX}/organization`,
  });

  fastify.register(teamRoutes, {
    prefix: `${env.API_PREFIX}/team`,
  });

  fastify.register(roleRoutes, {
    prefix: `${env.API_PREFIX}/role`,
  });

  fastify.log.info('Routes ready');
}
