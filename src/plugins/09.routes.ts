import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import healthRoutes from '@/modules/health/health.routes.js';
import storageRoutes from '@/modules/storage/storage.routes.js';
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

  fastify.log.info('Routes ready');
}
