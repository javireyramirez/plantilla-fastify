import { type BetterAuthOptions } from 'better-auth';
import type { Auth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import fp from 'fastify-plugin';

import { createAuth } from '@/config/auth/auth.js';

export default fp(
  async (fastify) => {
    const auth = createAuth(fastify.authService) as unknown as Auth<BetterAuthOptions>;
    fastify.decorate('auth', auth);

    // Handler que conecta better-auth con Fastify
    // Debe registrarse aquí antes que cualquier ruta de auth
    fastify.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      url: `/${fastify.config.API_PREFIX}/auth/*`,
      config: {
        rateLimit: fastify.rateLimitTiers.auth,
      },
      handler: async (request, reply) => {
        try {
          const url = new URL(request.url, `http://${request.headers.host}`);

          const headers = fromNodeHeaders(request.headers);

          const req = new Request(url.toString(), {
            method: request.method,
            headers,
            ...(request.body ? { body: JSON.stringify(request.body) } : {}),
          });

          const response = await auth.handler(req);

          reply.status(response.status);
          response.headers.forEach((value, key) => reply.header(key, value));
          return reply.send(response.body ? await response.text() : null);
        } catch (error) {
          fastify.log.error(`Authentication Error: ${error}`);
          return reply.status(500).send({
            error: 'Internal authentication error',
            code: 'AUTH_FAILURE',
          });
        }
      },
    });

    fastify.log.info('Better Auth ready');
  },
  {
    name: 'better-auth',
    dependencies: ['config', 'services'],
  },
);
