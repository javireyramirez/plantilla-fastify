import autoload from '@fastify/autoload';
import Fastify from 'fastify';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(autoload, {
    dir: join(__dirname, 'plugins'),
    forceESM: true,
  });

  return app;
}
