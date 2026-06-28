import { PermissionAction } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireEntityPermission } from '@/hooks/rbac-storage.js';
import { requireAuth } from '@/hooks/require.auth.js';
import { userContext } from '@/hooks/user.context.js';

import { TrashController } from './trash.controller.js';
import { GetTrashQuerySchema, TrashListResponseSchema } from './trash.schema.js';

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
      preHandler: [requireAuth, userContext],
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
      preHandler: [requireAuth, userContext, requireEntityPermission(PermissionAction.RESTORE)],
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
      preHandler: [requireAuth, userContext, requireEntityPermission(PermissionAction.DELETE)],
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
      preHandler: [requireAuth, userContext],
    },
    (req, reply) => controller.triggerCleanup(req as any, reply),
  );
}
