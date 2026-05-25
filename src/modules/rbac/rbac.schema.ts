import { z } from 'zod';

import {
  GetListQueryBase,
  OrganizationSchemaBase,
  OwnerOrganizationSchema,
  OwnerSchema,
  OwnerTeamSchema,
  ResponseListSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

// ==========================================
// ENUMS
// ==========================================

export const permissionScopeSchema = z.enum(['ALL', 'ORGANIZATION', 'TEAM', 'OWN']);

export const permissionActionSchema = z.enum([
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'EXPORT',
  'IMPORT',
  'MANAGE',
]);

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
  // Propiedad (RBAC)
  owner: OwnerSchema.optional().nullable(),
  ownerTeam: OwnerTeamSchema.optional().nullable(),
  ownerOrganization: OwnerOrganizationSchema.optional().nullable(),
});

export const RolePermissionSchema = z.object({
  id: z.uuidv7(),
  roleId: z.uuidv7(),
  moduleKey: z.string().min(1),
  action: permissionActionSchema,
  scope: permissionScopeSchema.default('OWN'),
  scopeId: z.string().optional().nullable(),
  grantedAt: z.date(),
  grantedBy: z.string().optional().nullable(),
  revokedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================

export const RoleIdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const PermissionScopeParamsSchema = z.object({
  newScope: permissionScopeSchema,
});

// ==========================================
// QUERIES
// ==========================================

export const GetRoleQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  name: z.string().optional(),
  sector: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetListQuery = GetListQueryBase;

export const GetPermissionsQuerySchema = z.object({
  // Paginación y orden
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default('grantedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Filtros de RBAC
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

  // Filtros de fecha
  grantedFrom: z.string().datetime().optional(),
  grantedTo: z.string().datetime().optional(),
});

// ==========================================
// BODIES
// ==========================================

export const CreateRoleBodySchema = RoleSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: true,
  deletedBy: true,
  restoreBy: true,
  updatedBy: true,
}).extend({
  ownerId: z.string().optional().nullable(),
  ownerTeamId: z.string().optional().nullable(),
  ownerOrganizationId: z.string().optional().nullable(),
});

export const UpdateRoleBodySchema = CreateRoleBodySchema.partial();

export const BulkCreateRoleBodySchema = z.array(CreateRoleBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const CreatePermissionBodySchema = z.object({
  scope: permissionScopeSchema,
  action: permissionActionSchema,
  moduleKey: z.string(),
});

export const BulkCreatePermissionBodySchema = z.array(CreatePermissionBodySchema);

export const BulkUpdatePermissionBodySchema = z.array(
  z.object({
    id: z.uuidv7(),
    permission: CreatePermissionBodySchema,
  }),
);

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

export const RoleDeleteResponseSchema = RoleSchema;
export const RoleRestoreResponseSchema = RoleSchema;

export const RolePermissionResponseSchema = RolePermissionSchema.extend({
  granter: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
  revoker: z.object({ id: z.string(), name: z.string(), email: z.string() }).optional().nullable(),
});

export const RolePermissionsListResponseSchema = z.object({
  data: z.array(RolePermissionResponseSchema),
  meta: z.object({
    total: z.number(),
    skip: z.number().optional(),
    take: z.number().optional(),
  }),
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
