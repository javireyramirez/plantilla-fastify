import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { BaseController } from '@/controllers/base.controller.js';
import { requireAuth } from '@/hooks/require.auth.js';
import { BaseRoutesOptions } from '@/types/base-routes.types.js';

export function registerBaseRoutes<T>(
  fastify: FastifyInstance,
  controller: BaseController<T>,
  options: BaseRoutesOptions,
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // ==========================================
  // BULK ROUTES (Deben ir antes de /:id)
  // ==========================================

  app.post(
    '/bulk',
    {
      schema: {
        tags: options.tags,
        body: options.schemas.bulkCreateBody,
        response: { 201: options.schemas.bulkResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.createMany(req as any, reply),
  );

  app.delete(
    '/bulk',
    {
      schema: {
        tags: options.tags,
        body: options.schemas.bulkIdsBody,
        response: { 200: options.schemas.bulkResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.softDeleteMany(req as any, reply),
  );

  app.patch(
    '/bulk/restore',
    {
      schema: {
        tags: options.tags,
        body: options.schemas.bulkIdsBody,
        response: { 200: options.schemas.bulkResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.restoreMany(req as any, reply),
  );

  app.delete(
    '/bulk/permanent',
    {
      schema: {
        tags: options.tags,
        body: options.schemas.bulkIdsBody,
        response: { 200: options.schemas.bulkResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.deletePermanentMany(req as any, reply),
  );

  // ==========================================
  // STANDARD ROUTES
  // ==========================================

  app.get(
    '/',
    {
      schema: {
        tags: options.tags,
        querystring: options.schemas.getManyQuery,
        response: { 200: options.schemas.getManyResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.getAll(req as any, reply),
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: options.tags,
        params: options.schemas.idParams,
        response: { 200: options.schemas.getOneResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.getById(req as any, reply),
  );

  app.post(
    '/',
    {
      schema: {
        tags: options.tags,
        body: options.schemas.createBody,
        response: { 201: options.schemas.createResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.create(req as any, reply),
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: options.tags,
        params: options.schemas.idParams,
        body: options.schemas.updateBody,
        response: { 200: options.schemas.updateResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.update(req as any, reply),
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: options.tags,
        params: options.schemas.idParams,
        response: { 200: options.schemas.deleteResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.softDelete(req as any, reply),
  );

  app.patch(
    '/:id/restore',
    {
      schema: {
        tags: options.tags,
        params: options.schemas.idParams,
        response: { 200: options.schemas.restoreResponse },
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.restore(req as any, reply),
  );

  app.delete(
    '/:id/permanent',
    {
      schema: {
        tags: options.tags,
        params: options.schemas.idParams,
        response: { 204: options.schemas.deleteResponse }, // El 204 no devuelve body
      },
      preHandler: [requireAuth],
    },
    (req, reply) => controller.deletePermanent(req as any, reply),
  );
}
