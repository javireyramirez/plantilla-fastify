import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { requireAuth } from '@/hooks/require.auth.js';

import { StorageController } from './storage.controller.js';
import {
  ConfirmParamsSchema,
  EntityIdParamsSchema,
  EntityParamsSchema,
  RequestUploadBodySchema,
  ResponseConfirmSchema,
  ResponseDocuments,
  ResponseDownloadSchema,
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

  app.patch(
    '/:entityId/:documentId/confirm-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Confirmar documento',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseConfirmSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.confirmUpload(req, reply),
  );

  app.get(
    '/:entityId/:documentId/download-url',
    {
      schema: {
        tags: ['Storage'],
        description: 'Descargar documento',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseDownloadSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.getPreSignedDownloadUrl(req, reply),
  );

  app.get(
    '/:entityId/:documentId/documents',
    {
      schema: {
        tags: ['Storage'],
        description: 'Lista de todos los documentos disponibles',
        params: EntityIdParamsSchema,
        response: {
          200: ResponseDocuments,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.getDocumentsByEntity(req, reply),
  );
}
