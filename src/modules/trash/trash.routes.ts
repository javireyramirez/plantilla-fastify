import { PermissionAction } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requirePermission } from '@/hooks/rbac.js';
import { requireEntityPermission } from '@/hooks/rbac-storage.js';
import { requireAuth } from '@/hooks/require.auth.js';
import { requireSuperAdmin } from '@/hooks/require.superadmin.js';
import { userContext } from '@/hooks/user.context.js';

import { TrashController } from './trash.controller.js';
import { GetTrashQuerySchema, TrashListResponseSchema, BulkIdsBodySchema, BulkResponseSchema } from './trash.schema.js';

export default async function trashRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const controller = new TrashController(app.trashService);

  // 1. GET / -> List authorized trash items
  app.get(
    '/',
    {
      schema: {
        tags: ['Trash'],
        description: 'Obtener la papelera de reciclaje unificada',
        querystring: GetTrashQuerySchema,
        response: {
          200: TrashListResponseSchema,
        },
      },
      preHandler: [requireAuth, userContext, requirePermission('trash', PermissionAction.READ)],
    },
    (req, reply) => controller.getTrash(req as any, reply),
  );

  // 2. POST /:entityType/:id/restore -> Restore item
  app.post(
    '/:entityType/:id/restore',
    {
      schema: {
        tags: ['Trash'],
        description: 'Restaurar un elemento de la papelera',
        params: z.object({
          entityType: z.string(),
          id: z.string().uuid(),
        }),
      },
      preHandler: [
        requireAuth,
        userContext,
        requirePermission('trash', PermissionAction.RESTORE),
        requireEntityPermission(PermissionAction.RESTORE),
      ],
    },
    (req, reply) => {
      const requestWithSlug = req as any;
      requestWithSlug.params.moduleSlug = requestWithSlug.params.entityType;
      return controller.restore(requestWithSlug, reply);
    },
  );

  // 3. DELETE /:entityType/:id -> Permanent deletion (Purge)
  app.delete(
    '/:entityType/:id',
    {
      schema: {
        tags: ['Trash'],
        description: 'Purgar definitivamente un elemento de la papelera',
        params: z.object({
          entityType: z.string(),
          id: z.string().uuid(),
        }),
      },
      preHandler: [
        requireAuth,
        userContext,
        requirePermission('trash', PermissionAction.DELETE),
        requireEntityPermission(PermissionAction.DELETE),
      ],
    },
    (req, reply) => {
      const requestWithSlug = req as any;
      requestWithSlug.params.moduleSlug = requestWithSlug.params.entityType;
      return controller.purge(requestWithSlug, reply);
    },
  );

  // 4. POST /empty-expired -> Manually trigger empty expired trash (Admin only)
  app.post(
    '/empty-expired',
    {
      schema: {
        tags: ['Trash'],
        description: 'Ejecutar limpieza de papelera expirada (SuperAdmin)',
      },
      preHandler: [requireAuth, userContext, requireSuperAdmin],
    },
    (req, reply) => controller.triggerCleanup(req as any, reply),
  );

  // 5. PATCH /bulk/restore -> Bulk restore items
  app.patch(
    '/bulk/restore',
    {
      schema: {
        tags: ['Trash'],
        description: 'Restaurar varios elementos de la papelera en lote',
        body: BulkIdsBodySchema,
        response: {
          200: BulkResponseSchema,
        },
      },
      preHandler: [
        requireAuth,
        userContext,
        requirePermission('trash', PermissionAction.RESTORE),
      ],
    },
    (req, reply) => controller.restoreMany(req as any, reply),
  );

  // 6. DELETE /bulk/permanent -> Bulk purge items
  app.delete(
    '/bulk/permanent',
    {
      schema: {
        tags: ['Trash'],
        description: 'Purgar definitivamente varios elementos de la papelera en lote',
        body: BulkIdsBodySchema,
        response: {
          200: BulkResponseSchema,
        },
      },
      preHandler: [
        requireAuth,
        userContext,
        requirePermission('trash', PermissionAction.DELETE),
      ],
    },
    (req, reply) => controller.purgeMany(req as any, reply),
  );
}
