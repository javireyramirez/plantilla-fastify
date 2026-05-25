import { FastifyInstance } from 'fastify';

import {
  BulkCreatePermissionBodySchema,
  BulkCreateRoleBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  BulkUpdatePermissionBodySchema,
  CreatePermissionBodySchema,
  CreateRoleBodySchema,
  GetListQuery,
  GetPermissionsQuerySchema,
  GetRoleQuerySchema,
  ResponseListSchema,
  RoleIdParamsSchema,
  RoleListResponseSchema,
  RolePermissionResponseSchema,
  RolePermissionsListResponseSchema,
  RoleResponseSchema,
  UpdateRoleBodySchema,
} from '@/modules/rbac/rbac.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function roleRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.roleController, {
    tags: ['Role'],
    schemas: {
      // Parámetros
      idParams: RoleIdParamsSchema,
      // Query
      getManyQuery: GetRoleQuerySchema,
      GetListQuery: GetListQuery,
      // Body
      createBody: CreateRoleBodySchema,
      updateBody: UpdateRoleBodySchema,
      bulkCreateBody: BulkCreateRoleBodySchema,
      bulkIdsBody: BulkIdsBodySchema,
      // Respuestas
      getManyResponse: RoleListResponseSchema,
      getOneResponse: RoleResponseSchema,
      createResponse: RoleResponseSchema,
      updateResponse: RoleResponseSchema,
      deleteResponse: RoleResponseSchema,
      restoreResponse: RoleResponseSchema,
      bulkResponse: BulkResponseSchema,
      getListResponse: ResponseListSchema,
    },
  });

  // ==========================================
  // 1. LECTURA
  // ==========================================

  fastify.get('/:roleId/permissions', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      querystring: GetPermissionsQuerySchema,
      response: { 200: RolePermissionsListResponseSchema },
    },
    handler: fastify.roleController.getAllPermissions.bind(fastify.roleController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  fastify.post('/:roleId/permissions', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: CreatePermissionBodySchema,
      response: { 201: RolePermissionResponseSchema },
    },
    handler: fastify.roleController.addPermission.bind(fastify.roleController),
  });

  fastify.delete('/:roleId/permissions/:id', {
    schema: {
      tags: ['Role Permissions'],
      params: {
        roleId: RoleIdParamsSchema.shape.id,
        id: RoleIdParamsSchema.shape.id,
      },
      response: { 200: RolePermissionResponseSchema },
    },
    handler: fastify.roleController.revokePermission.bind(fastify.roleController),
  });

  fastify.patch('/:roleId/permissions/:id', {
    schema: {
      tags: ['Role Permissions'],
      params: {
        roleId: RoleIdParamsSchema.shape.id,
        id: RoleIdParamsSchema.shape.id,
      },
      body: CreatePermissionBodySchema,
      response: { 200: RolePermissionResponseSchema },
    },
    handler: fastify.roleController.updatePermission.bind(fastify.roleController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  fastify.post('/:roleId/permissions/bulk', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: BulkCreatePermissionBodySchema,
      response: { 201: BulkResponseSchema },
    },
    handler: fastify.roleController.bulkAddPermissions.bind(fastify.roleController),
  });

  fastify.delete('/:roleId/permissions/bulk', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: BulkIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    handler: fastify.roleController.bulkRevokePermissions.bind(fastify.roleController),
  });

  fastify.patch('/:roleId/permissions/bulk', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: BulkUpdatePermissionBodySchema,
      response: { 200: BulkResponseSchema },
    },
    handler: fastify.roleController.bulkUpdatePermissions.bind(fastify.roleController),
  });
}
