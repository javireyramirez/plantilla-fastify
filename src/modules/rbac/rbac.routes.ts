import { PermissionAction } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { memberContext } from '@/hooks/member.context.js';
import { requirePermission } from '@/hooks/rbac.js';
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
  const app = fastify.withTypeProvider<ZodTypeProvider>();

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

  // ==========================================
  // 1. LECTURA
  // ==========================================

  app.get('/:roleId/permissions', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      querystring: GetPermissionsQuerySchema,
      response: { 200: RolePermissionsListResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.READ)],
    handler: fastify.roleController.getAllPermissions.bind(fastify.roleController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  app.post('/:roleId/permissions', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: CreatePermissionBodySchema,
      response: { 201: RolePermissionResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.addPermission.bind(fastify.roleController),
  });

  app.delete('/:roleId/permissions/:id', {
    schema: {
      tags: ['Role Permissions'],
      params: RolePermissionIdParamsSchema,
      response: { 200: RolePermissionResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.revokePermission.bind(fastify.roleController),
  });

  app.patch('/:roleId/permissions/:id', {
    schema: {
      tags: ['Role Permissions'],
      params: RolePermissionIdParamsSchema,

      body: CreatePermissionBodySchema,
      response: { 200: RolePermissionResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.updatePermissionScope.bind(fastify.roleController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  app.post('/:roleId/permissions/bulk', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: BulkCreatePermissionBodySchema,
      response: { 201: BulkResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.bulkAddPermissions.bind(fastify.roleController),
  });

  app.delete('/:roleId/permissions/bulk', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: BulkIdsBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.bulkRevokePermissions.bind(fastify.roleController),
  });

  app.patch('/:roleId/permissions/bulk', {
    schema: {
      tags: ['Role Permissions'],
      params: RoleIdParamsSchema,
      body: BulkUpdatePermissionBodySchema,
      response: { 200: BulkResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.bulkUpdatePermissions.bind(fastify.roleController),
  });

  // ==========================================
  // Asignaciones
  // ==========================================

  // ==========================================
  // 1. LECTURA
  // ==========================================

  app.get('/:roleId/assignments', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      querystring: GetAssignmentsQuerySchema,
      response: { 200: AssignmentListResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.READ)],
    handler: fastify.roleController.getAllAssignments.bind(fastify.roleController),
  });

  app.get('/:roleId/assignments/:id', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleAssignmentParamsSchema,
      response: { 200: RoleAssignmentResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.READ)],
    handler: fastify.roleController.getAssignmentById.bind(fastify.roleController),
  });

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  app.post('/:roleId/assignments', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      body: CreateAssignmentBodySchema,
      response: { 201: RoleAssignmentResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.assign.bind(fastify.roleController),
  });

  app.delete('/:roleId/assignments/:id', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleAssignmentParamsSchema,
      response: { 200: RoleAssignmentResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.unassign.bind(fastify.roleController),
  });

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  app.post('/:roleId/assignments/bulk', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      body: BulkCreateAssignmentBodySchema,
      response: { 201: BulkAssignmentResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.bulkAssign.bind(fastify.roleController),
  });

  app.delete('/:roleId/assignments/bulk', {
    schema: {
      tags: ['Role Assignments'],
      params: RoleIdParamsSchema,
      body: BulkAssignmentIdsBodySchema,
      response: { 200: BulkAssignmentResponseSchema },
    },
    preHandler: [requireAuth, memberContext, requirePermission('roles', PermissionAction.SETTINGS)],
    handler: fastify.roleController.bulkUnassign.bind(fastify.roleController),
  });
}
