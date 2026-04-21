import fp from 'fastify-plugin';
import { z } from 'zod';

import { type AppConfig, envSchema } from '@/config/env.js';

export default fp(
  async (fastify) => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      fastify.log.error({ errors: parsed.error.flatten() }, 'Invalid environment variables');
      process.exit(1);
    }

    fastify.decorate('config', parsed.data as any);
    fastify.log.info('Config ready');
  },
  { name: 'config' },
);

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}
