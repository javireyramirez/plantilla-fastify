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

  fastify.addHook('onRequest', async (request) => {
    if (env.NODE_ENV !== 'production' && !request.headers.origin) {
      request.headers.origin = env.BACKEND_URL;
    }
  });

  app.post('/sign-in/email', {
    schema: {
      tags: ['Auth'],
      summary: 'Inicio de sesión',
      body: SignInSchema,
      security: [],
    },
    handler: bridge,
  });

  app.post('/sign-up/email', {
    schema: {
      tags: ['Auth'],
      body: SignUpSchema,
    },
    handler: bridge,
  });

  app.post('/update-user', {
    schema: {
      tags: ['Auth'],
      summary: 'Actualizar usuario',
      body: UpdateUserSchema,
    },
    preHandler: [requireAuth],
    handler: bridge,
  });

  app.all('/*', {
    schema: {
      tags: ['Auth'],
      hide: true,
    },
    handler: bridge,
  });
}
