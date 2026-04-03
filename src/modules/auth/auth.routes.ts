import { toNodeHandler } from 'better-auth/node';
import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { env } from '@/config/env.js';
import { requireAuth } from '@/hooks/require.auth.js';

import { SignInSchema, SignUpSchema, UpdateUserSchema } from './auth.schema.js';
import { authBridge } from './auth.utils.js';

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const handler = toNodeHandler(fastify.auth);
  const bridge = authBridge(handler);

  // Middleware equivalente al de Express para desarrollo
  fastify.addHook('onRequest', async (request) => {
    if (env.NODE_ENV !== 'production' && !request.headers.origin) {
      request.headers.origin = env.BACKEND_URL;
    }
  });

  // Validación en sign-in — Fastify valida con schema y luego pasa a Better Auth
  app.post('/sign-in/email', {
    schema: {
      tags: ['Auth'],
      summary: 'Inicio de sesión',
      body: SignInSchema,
      security: [],
    },
    handler: bridge,
  });

  // Validación en sign-up
  app.post('/sign-up/email', {
    schema: {
      tags: ['Auth'],
      body: SignUpSchema,
    },
    handler: bridge,
  });

  // Ruta protegida con validación
  app.post('/update-user', {
    schema: {
      tags: ['Auth'],
      summary: 'Actualizar usuario',
      body: UpdateUserSchema,
    },
    preHandler: [requireAuth],
    handler: bridge,
  });

  // Wildcard — captura todo lo demás de Better Auth
  app.all('/*', {
    schema: {
      tags: ['Auth'],
      hide: true,
    },
    handler: bridge,
  });
}
