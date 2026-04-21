import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export default fp(
  async (fastify) => {
    if (!fastify.config.SWAGGER_ENABLED) {
      fastify.log.info('Swagger disabled (SWAGGER_ENABLED=false)');
      return;
    }

    await fastify.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'Enterprise API',
          version: '1.0.0',
        },
        servers: [{ url: fastify.config.BACKEND_URL }],
        components: {
          securitySchemes: {
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'better-auth.session_token',
            },
          },
        },
        // Esto aplica el candado a todo lo que no sea explícitamente público
        security: [{ cookieAuth: [] }],
      },

      transform: (data) => {
        return jsonSchemaTransform(data);
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: `/docs`,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        persistAuthorization: true,
      },
      staticCSP: true,
    });

    fastify.log.info(`Swagger UI available at ${fastify.config.API_PREFIX}/docs`);
  },
  {
    name: 'swagger',
    dependencies: ['config'],
  },
);
