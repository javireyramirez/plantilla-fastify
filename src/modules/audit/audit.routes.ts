import { PermissionAction } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { buildPreHandler } from '@/hooks/buildPreHandler.js';
import { BaseRoutesOptions } from '@/types/base-routes.types.js';
import {
  AuditLogIdParamsSchema,
  AuditLogResponseSchema,
  AuditLogsListResponseSchema,
  GetAuditLogsQuerySchema,
  GetListQuery,
  ResponseListSchema,
} from './audit.schema.js';

export default async function auditRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const resource = 'audit';
  const tags = ['Audit Logs'];

  const options: BaseRoutesOptions = {
    resource,
    tags,
    schemas: {},
  };

  // GET / (Obtener todos los logs paginados)
  app.get(
    '/',
    {
      schema: {
        tags,
        querystring: GetAuditLogsQuerySchema,
        response: {
          200: AuditLogsListResponseSchema,
        },
      },
      preHandler: buildPreHandler(resource, PermissionAction.READ, options),
    },
    (req, reply) => fastify.auditLogController.getAll(req as any, reply),
  );

  // GET /list (Obtener listado rápido)
  app.get(
    '/list',
    {
      schema: {
        tags,
        querystring: GetListQuery,
        response: {
          200: ResponseListSchema,
        },
      },
      preHandler: buildPreHandler(resource, PermissionAction.READ, options),
    },
    (req, reply) => fastify.auditLogController.getList(req as any, reply),
  );

  // GET /:id (Obtener detalle por ID)
  app.get(
    '/:id',
    {
      schema: {
        tags,
        params: AuditLogIdParamsSchema,
        response: {
          200: AuditLogResponseSchema,
        },
      },
      preHandler: buildPreHandler(resource, PermissionAction.READ, options),
    },
    (req, reply) => fastify.auditLogController.getById(req as any, reply),
  );
}
