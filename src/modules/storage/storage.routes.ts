import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { requireAuth } from '@/hooks/require.auth.js';

import { StorageController } from './storage.controller.js';
import {
  BulkActionSchema,
  BulkUpdateResponseSchema,
  ConfirmParamsSchema,
  EntityParamsSchema,
  GetDocumentsQuerySchema,
  RequestUploadBodySchema,
  ResponseDeleteSchema,
  ResponseDocuments,
  ResponseDownloadBulkSchema,
  ResponseDownloadSchema,
  ResponseStatusChangeSchema,
  ResponseUploadSchema,
  UpdateMetadataSchema,
} from './storage.schema.js';

export default async function storageRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const controller = new StorageController(app.storageService);

  // ==========================================
  // 1. CONSULTAS Y LECTURA
  // ==========================================

  app.get(
    '/:entityType/:entityId/documents',
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
    (req, reply) => controller.getDocumentsByEntity(req as any, reply),
  );

  app.get(
    '/:entityType/:entityId/:documentId',
    {
      schema: {
        tags: ['Storage'],
        description: 'Obtener información detallada de un documento',
        params: ConfirmParamsSchema,
        response: { 200: ResponseStatusChangeSchema },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.getDocument(req as any, reply),
  );

  app.get(
    '/:entityType/:entityId/:documentId/download-url',
    {
      schema: {
        tags: ['Storage'],
        description: 'Generar URL temporal de descarga',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseDownloadSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.getPreSignedDownloadUrl(req as any, reply),
  );

  // ==========================================
  // 2. CICLO DE VIDA DE SUBIDA (UPLOAD)
  // ==========================================

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
    (req, reply) => controller.requestUploadUrl(req as any, reply),
  );

  app.patch(
    '/:entityType/:entityId/:documentId/confirm-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Confirmar que el archivo se subió correctamente a S3',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseStatusChangeSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.confirmUpload(req as any, reply),
  );

  // ==========================================
  // 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
  // ==========================================

  app.patch(
    '/:entityType/:entityId/:documentId/metadata',
    {
      schema: {
        tags: ['Storage'],
        description: 'Actualizar metadatos del documento (nombre, privacidad)',
        params: ConfirmParamsSchema,
        body: UpdateMetadataSchema,
        response: { 200: ResponseStatusChangeSchema },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.updateMetadata(req as any, reply),
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
    (req, reply) => controller.deleteSoft(req as any, reply),
  );

  app.patch(
    '/:entityType/:entityId/:documentId/restore-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Restaurar documento de la papelera',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseStatusChangeSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.restore(req as any, reply),
  );

  // ==========================================
  // 4. ACCIONES MASIVAS (BULK)
  // ==========================================

  app.patch(
    '/:entityType/:entityId/bulk-delete',
    {
      schema: {
        tags: ['Storage'],
        description: 'Mover múltiples documentos a la papelera',
        params: EntityParamsSchema,
        body: BulkActionSchema,
        response: { 200: BulkUpdateResponseSchema },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.bulkDeleteSoft(req as any, reply),
  );

  app.patch(
    '/:entityType/:entityId/bulk-restore',
    {
      schema: {
        tags: ['Storage'],
        description: 'Restaurar múltiples documentos de la papelera',
        params: EntityParamsSchema,
        body: BulkActionSchema,
        response: { 200: BulkUpdateResponseSchema },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.bulkRestore(req as any, reply),
  );

  app.post(
    '/:entityType/:entityId/bulk-download',
    {
      schema: {
        tags: ['Storage'],
        description: 'Descargar múltiples documentos (URLs)',
        params: EntityParamsSchema,
        body: BulkActionSchema,
        response: { 200: ResponseDownloadBulkSchema },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.bulkDownload(req as any, reply),
  );

  app.post(
    '/:entityType/:entityId/bulk-download-zip',
    {
      schema: {
        tags: ['Storage'],
        description: 'Descargar múltiples documentos como ZIP',
        params: EntityParamsSchema,
        body: BulkActionSchema,
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.bulkDownloadZip(req as any, reply),
  );

  // ==========================================
  // 5. MANTENIMIENTO Y ELIMINACIÓN FÍSICA
  // ==========================================

  app.delete(
    '/:entityType/:entityId/empty-trash',
    {
      schema: {
        tags: ['Storage'],
        description: 'Eliminar permanentemente todos los archivos de la papelera',
        params: EntityParamsSchema,
        response: { 200: ResponseDeleteSchema },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.emptyTrash(req as any, reply),
  );

  app.delete(
    '/:entityType/:entityId/:documentId/delete-document',
    {
      schema: {
        tags: ['Storage'],
        description: 'Borrar definitivamente un documento de la papelera',
        params: ConfirmParamsSchema,
        response: {
          200: ResponseDeleteSchema,
        },
      },
      preHandler: requireAuth,
    },
    (req, reply) => controller.deletePermanent(req as any, reply),
  );
}
