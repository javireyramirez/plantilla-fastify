import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

// Importante

import { buildApp } from '@/app.js';
import { env } from '@/config/env.js';

let app: FastifyInstance<any, any, any, any, ZodTypeProvider>;

async function main() {
  app = await buildApp();

  const host = env.HOST;
  const port = Number(env.PORT);

  try {
    await app.listen({ host, port });
  } catch (err) {
    if (app) app.log.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

const signals = ['SIGINT', 'SIGTERM'] as const;

for (const signal of signals) {
  process.once(signal, async () => {
    try {
      if (app) {
        app.log.info(`Recibida señal ${signal}, cerrando servidor...`);
        await app.close();
      }
      process.exit(0);
    } catch (err) {
      if (app) app.log.error({ err }, 'Error durante el apagado');
      process.exit(1);
    }
  });
}

main();
