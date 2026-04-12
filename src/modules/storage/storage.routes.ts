import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { requireAuth } from '@/hooks/require.auth.js';

import { StorageController } from './storage.controller.js';
import {
  ConfirmParamsSchema,
  EntityParamsSchema,
  GetDocumentsQuerySchema,
  RequestUploadBodySchema,
  ResponseDeleteSchema,
  ResponseDocuments,
  ResponseDownloadSchema,
  ResponseStatusChangeSchema,
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
    '/:entityType/:entityId/:documentId/confirm-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Confirmar documento',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseStatusChangeSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.confirmUpload(req, reply),
  );

  app.get(
    '/:entityType/:entityId/:documentId/download-url',
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
    '/:entityType/:entityId/:documentId/documents',
    {
      schema: {
        tags: ['Storage'],
        description: 'Lista de todos los documentos disponibles',
        params: EntityParamsSchema,
        querystring: GetDocumentsQuerySchema,
        response: {
          200: ResponseDocuments,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.getDocumentsByEntity(req, reply),
  );

  app.patch(
    '/:entityType/:entityId/:documentId/delete-soft-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Mandar a la papelera documento',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseStatusChangeSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.deleteSoftDocument(req, reply),
  );

  app.delete(
    '/:entityType/:entityId/:documentId/delete-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Borrar definitivamente documento',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseDeleteSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.deleteDocument(req, reply),
  );

  app.patch(
    '/:entityType/:entityId/:documentId/restore-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Restaurar documento',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseStatusChangeSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.deleteDocument(req, reply),
  );
}
