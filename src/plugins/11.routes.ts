import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import companiesRoutes from '@/modules/companies/companies.routes.js';
import healthRoutes from '@/modules/health/health.routes.js';
import moduleRoutes from '@/modules/module/module.routes.js';
import roleRoutes from '@/modules/rbac/rbac.routes.js';
import storageRoutes from '@/modules/storage/storage.routes.js';
import teamRoutes from '@/modules/team/team.routes.js';
import trashRoutes from '@/modules/trash/trash.routes.js';
import usersRoutes from '@/modules/users/users.routes.js';
import auditRoutes from '@/modules/audit/audit.routes.js';
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
    prefix: `${env.API_PREFIX}/companies`,
  });

  fastify.register(teamRoutes, {
    prefix: `${env.API_PREFIX}/teams`,
  });

  fastify.register(roleRoutes, {
    prefix: `${env.API_PREFIX}/roles`,
  });

  fastify.register(moduleRoutes, {
    prefix: `${env.API_PREFIX}/modules`,
  });

  fastify.register(usersRoutes, {
    prefix: `${env.API_PREFIX}/users`,
  });

  fastify.register(trashRoutes, {
    prefix: `${env.API_PREFIX}/trash`,
  });

  fastify.register(auditRoutes, {
    prefix: `${env.API_PREFIX}/audit`,
  });

  fastify.log.info('Routes ready');
}
