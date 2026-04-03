import { FastifyInstance } from 'fastify';

import { EmailProvider } from '@/modules/email/email.provider.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      tags: ['Health'],
      summary: 'Revisa si el servidor, la base de datos y el email están operativos',
      security: [],
    },
    handler: async (request, reply) => {
      const isEmailOk = await EmailProvider.verifyConnection();

      const healthData = {
        status: isEmailOk ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'UNKNOWN',
          email: isEmailOk ? 'UP' : 'DOWN',
        },
      };

      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        healthData.services.database = 'UP';

        return healthData;
      } catch (error) {
        healthData.status = 'DOWN';
        healthData.services.database = 'DOWN';

        fastify.log.error({ msg: 'Health check failed', error });

        return reply.status(503).send(healthData);
      }
    },
  });
}
