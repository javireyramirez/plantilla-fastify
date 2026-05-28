import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PermissionAction } from '@prisma/client';

import { BaseController } from '@/controllers/base.controller.js';
import { requireAuth } from '@/hooks/require.auth.js';
import { memberContext } from '@/hooks/member.context.js';
import { requirePermission } from '@/hooks/rbac.js';
import { BaseRoutesOptions } from '@/types/base-routes.types.js';

export function registerBaseRoutes<T>(
  fastify: FastifyInstance,
  controller: BaseController<T>,
  options: BaseRoutesOptions,
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/bulk',
    {
      schema: {
        tags: options.tags,
        body: options.schemas.bulkCreateBody,
        response: { 201: options.schemas.bulkResponse },
      },
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.CREATE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.DELETE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.RESTORE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.DELETE),
      ],
    },
    (req, reply) => controller.deletePermanentMany(req as any, reply),
  );

  app.get(
    '/',
    {
      schema: {
        tags: options.tags,
        querystring: options.schemas.getManyQuery,
        response: { 200: options.schemas.getManyResponse },
      },
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.READ),
      ],
    },
    (req, reply) => controller.getAll(req as any, reply),
  );

  app.get(
    '/list',
    {
      schema: {
        tags: options.tags,
        querystring: options.schemas.GetListQuery,
        response: { 200: options.schemas.getListResponse },
      },
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.READ),
      ],
    },
    (req, reply) => controller.getList(req as any, reply),
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: options.tags,
        params: options.schemas.idParams,
        response: { 200: options.schemas.getOneResponse },
      },
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.READ),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.CREATE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.UPDATE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.DELETE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.RESTORE),
      ],
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
      preHandler: [
        requireAuth,
        memberContext,
        requirePermission(options.resource, PermissionAction.DELETE),
      ],
    },
    (req, reply) => controller.deletePermanent(req as any, reply),
  );
}
