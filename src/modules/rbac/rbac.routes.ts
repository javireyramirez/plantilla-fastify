import { FastifyInstance } from 'fastify';

import { requireAuth } from '@/hooks/require.auth.js';
import {
  AssignmentIdParamsSchema,
  AssignmentListResponseSchema,
  BulkAssignmentIdsBodySchema,
  BulkAssignmentResponseSchema,
  BulkCreateAssignmentBodySchema,
  BulkCreatePermissionBodySchema,
  BulkCreateRoleBodySchema,
  BulkIdsBodySchema,
  BulkResponseSchema,
  BulkUpdatePermissionBodySchema,
  CreateAssignmentBodySchema,
  CreatePermissionBodySchema,
  CreateRoleBodySchema,
  GetAssignmentsQuerySchema,
  GetListQuery,
  GetPermissionsQuerySchema,
  GetRoleQuerySchema,
  IdParamsSchema,
  ResponseListSchema,
  RoleAssignmentParamsSchema,
  RoleAssignmentResponseSchema,
  RoleIdParamsSchema,
  RoleListResponseSchema,
  RolePermissionIdParamsSchema,
  RolePermissionResponseSchema,
  RolePermissionsListResponseSchema,
  RoleResponseSchema,
  UpdateRoleBodySchema,
} from '@/modules/rbac/rbac.schema.js';
import { registerBaseRoutes } from '@/routes/base.routes.js';

export default async function roleRoutes(fastify: FastifyInstance) {
  registerBaseRoutes(fastify, fastify.roleController, {
    resource: 'roles',
    tags: ['Role'],
    schemas: {
      // Parámetros
      idParams: IdParamsSchema,
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

  fastify.addHook('preHandler', requireAuth);

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
        roleId: RolePermissionIdParamsSchema.shape.roleId,
        id: RolePermissionIdParamsSchema.shape.id,
      },
      response: { 200: RolePermissionResponseSchema },
    },
    handler: fastify.roleController.revokePermission.bind(fastify.roleController),
  });

  fastify.patch('/:roleId/permissions/:id', {
    schema: {
      tags: ['Role Permissions'],
      params: {
        roleId: RolePermissionIdParamsSchema.shape.roleId,
        id: RolePermissionIdParamsSchema.shape.id,
      },
      body: CreatePermissionBodySchema,
      response: { 200: RolePermissionResponseSchema },
    },
    handler: fastify.roleController.updatePermissionScope.bind(fastify.roleController),
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

  // ==========================================
  // Asignaciones
  // ==========================================

  // ==========================================
  // 1. LECTURA
  // ==========================================

  fastify.get('/:roleId/assignments', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      querystring: GetAssignmentsQuerySchema,
      response: { 200: AssignmentListResponseSchema },
    },
    handler: fastify.roleController.getAllAssignments.bind(fastify.roleController),
  });

  fastify.get('/:roleId/assignments/:id', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleAssignmentParamsSchema,
      response: { 200: RoleAssignmentResponseSchema },
    },
    handler: fastify.roleController.getAssignmentById.bind(fastify.roleController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  fastify.post('/:roleId/assignments', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      body: CreateAssignmentBodySchema,
      response: { 201: RoleAssignmentResponseSchema },
    },
    handler: fastify.roleController.assign.bind(fastify.roleController),
  });

  fastify.delete('/:roleId/assignments/:id', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleAssignmentParamsSchema,
      response: { 200: RoleAssignmentResponseSchema },
    },
    handler: fastify.roleController.unassign.bind(fastify.roleController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  fastify.post('/:roleId/assignments/bulk', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      body: BulkCreateAssignmentBodySchema,
      response: { 201: BulkAssignmentResponseSchema },
    },
    handler: fastify.roleController.bulkAssign.bind(fastify.roleController),
  });

  fastify.delete('/:roleId/assignments/bulk', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      body: BulkAssignmentIdsBodySchema,
      response: { 200: BulkAssignmentResponseSchema },
    },
    handler: fastify.roleController.bulkUnassign.bind(fastify.roleController),
  });
}
