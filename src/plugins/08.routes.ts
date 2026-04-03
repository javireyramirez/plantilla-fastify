import type { FastifyInstance } from 'fastify';

import { env } from '@/config/env.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import healthRoutes from '@/modules/health/health.routes.js';

export default async function routes(fastify: FastifyInstance) {
  fastify.register(healthRoutes, { prefix: `${env.API_PREFIX}/health` });
  fastify.register(authRoutes, { prefix: `${env.API_PREFIX}/auth` });

  fastify.log.info('Routes ready');
}
