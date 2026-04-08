import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { requireAuth } from '@/hooks/require.auth.js';

import { StorageController } from './storage.controller.js';
import {
  EntityParamsSchema,
  RequestUploadBodySchema,
  ResponseUploadSchema,
} from './storage.schema.js';

export default async function storageRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const controller = new StorageController(app.storageService);

  app.post(
    '/:entityType/:entityId/upload-url',
    {
      schema: {
        tags: ['Storage'],
        description: 'Solicitar url de subida',
        params: EntityParamsSchema,
        body: RequestUploadBodySchema,
        response: {
          201: ResponseUploadSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.requestUploadUrl(req, reply),
  );
}
