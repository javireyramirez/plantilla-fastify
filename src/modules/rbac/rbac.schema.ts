import { PermissionAction, PermissionScope } from '@prisma/client';
import { z } from 'zod';

import {
  GetListQueryBase,
  ResponseListSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

// ==========================================
// ENUMS
// ==========================================

export const permissionScopeSchema = z.enum(PermissionScope);
export const permissionActionSchema = z.enum(PermissionAction);

// ==========================================
// BASE SCHEMAS
// ==========================================

export const RoleSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  isSystem: z.boolean().default(false),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  status: recordStatusSchema,
  // Auditoría
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  restoreAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});

export const RolePermissionSchema = z.object({
  id: z.uuidv7(),
  roleId: z.uuidv7(),
  moduleId: z.uuidv7(),
  action: permissionActionSchema,
  scope: permissionScopeSchema.default('OWN'),
  // ✅ CORREGIDO: Eliminados 'scopeId' y 'revokedBy'. Añadidos los campos reales de auditoría.
  grantedAt: z.date(),
  grantedBy: z.string().optional().nullable(),
  updatedAt: z.date(),
  updatedBy: z.string().optional().nullable(),
});

export const RoleAssignmentSchema = z.object({
  id: z.uuidv7(),
  roleId: z.uuidv7(),
  userId: z.uuidv7().optional().nullable(),
  teamId: z.uuidv7().optional().nullable(),
  assignedAt: z.date(),
  assignedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================

export const IdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const RoleIdParamsSchema = z.object({
  roleId: z.uuidv7(),
});

export const RolePermissionIdParamsSchema = z.object({
  roleId: z.uuidv7(),
  id: z.uuidv7(),
});

export const PermissionScopeParamsSchema = z.object({
  newScope: permissionScopeSchema,
});

export const AssignmentIdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const RoleAssignmentParamsSchema = z.object({
  roleId: z.uuidv7(),
  id: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetRoleQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  name: z.string().optional(),
  isSystem: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetListQuery = GetListQueryBase;

export const GetPermissionsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default('grantedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Filtros de RBAC (se mapea a moduleId en el service)
  resource: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string()).optional(),
  ),
  action: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string()).optional(),
  ),
  scope: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.string()).optional(),
  ),

  grantedFrom: z.string().datetime().optional(),
  grantedTo: z.string().datetime().optional(),
});

export const GetAssignmentsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  userId: z.string().optional(),
  teamId: z.string().optional(),

  assignedFrom: z.string().datetime().optional(),
  assignedTo: z.string().datetime().optional(),
});

// ==========================================
// BODIES
// ==========================================

export const CreateRoleBodySchema = RoleSchema.omit({
  id: true,
  isSystem: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  restoreAt: true,
  createdBy: true,
  deletedBy: true,
  restoreBy: true,
  updatedBy: true,
});

export const UpdateRoleBodySchema = CreateRoleBodySchema.partial();

export const BulkCreateRoleBodySchema = z.array(CreateRoleBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const CreatePermissionBodySchema = z.object({
  scope: permissionScopeSchema,
  action: permissionActionSchema,
  moduleId: z.uuidv7(),
});

export const BulkCreatePermissionBodySchema = z.array(CreatePermissionBodySchema);

export const BulkUpdatePermissionBodySchema = z.array(
  z.object({
    id: z.uuidv7(),
    scope: permissionScopeSchema,
  }),
);

export const CreateAssignmentBodySchema = z
  .object({
    userId: z.uuidv7().optional().nullable(),
    teamId: z.uuidv7().optional().nullable(),
  })
  .refine((data) => data.userId || data.teamId, {
    message: 'Se debe especificar al menos un destinatario: userId, teamId',
  });

export const BulkCreateAssignmentBodySchema = z.array(CreateAssignmentBodySchema);

export const BulkAssignmentIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

// ==========================================
// RESPONSES
// ==========================================

export const RoleResponseSchema = RoleSchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const RoleListResponseSchema = z.object({
  data: z.array(RoleSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const RoleDeletedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const BulkResponseSchema = z.object({
  count: z.number(),
});

// ✅ CORREGIDO: Ajustado al include real de tu RoleService (granter y updater)
export const RolePermissionResponseSchema = RolePermissionSchema.extend({
  granter: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
  updater: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
});

export const RolePermissionsListResponseSchema = z.object({
  data: z.array(RolePermissionResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number().optional(), // Cambiado de skip/take a page/limit para que sea simétrico con tu arquitectura global
    limit: z.number().optional(),
  }),
});

// ✅ CORREGIDO: Sincronizado exactamente con el select del ASSIGNMENT_INCLUDE de tu servicio
export const RoleAssignmentResponseSchema = RoleAssignmentSchema.extend({
  granter: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
  assignedUser: z
    .object({ id: z.string(), name: z.string(), email: z.string() })
    .optional()
    .nullable(),
  assignedTeam: z
    .object({ id: z.string(), name: z.string() }) // ❌ Removido slug porque tu service no lo pide en el select
    .optional()
    .nullable(),
  role: z.object({ id: z.string(), name: z.string(), slug: z.string() }).optional().nullable(),
});

export const AssignmentListResponseSchema = z.object({
  data: z.array(RoleAssignmentResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
});

export const BulkAssignmentResponseSchema = z.object({
  count: z.number(),
});

// ==========================================
// TYPES
// ==========================================

export type Role = z.infer<typeof RoleSchema>;
export type CreateRole = z.infer<typeof CreateRoleBodySchema>;
export type UpdateRole = z.infer<typeof UpdateRoleBodySchema>;

export type GetPermissionsQuery = z.infer<typeof GetPermissionsQuerySchema>;
export type CreatePermissionBody = z.infer<typeof CreatePermissionBodySchema>;
export type BulkCreatePermissionBody = z.infer<typeof BulkCreatePermissionBodySchema>;
export type BulkUpdatePermissionBody = z.infer<typeof BulkUpdatePermissionBodySchema>;
export type RolePermission = z.infer<typeof RolePermissionResponseSchema>;
export type PermissionScopeParams = z.infer<typeof PermissionScopeParamsSchema>;
export type PermissionScopeType = z.infer<typeof permissionScopeSchema>;

export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;
export type RoleAssignmentResponse = z.infer<typeof RoleAssignmentResponseSchema>;
export type CreateAssignmentBody = z.infer<typeof CreateAssignmentBodySchema>;
export type BulkCreateAssignmentBody = z.infer<typeof BulkCreateAssignmentBodySchema>;
export type GetAssignmentsQuery = z.infer<typeof GetAssignmentsQuerySchema>;
