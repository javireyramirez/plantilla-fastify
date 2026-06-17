// @/modules/modules/model/modules.schema.ts
import { z } from 'zod';

import {
  AuditFieldsSchema,
  GetListQueryBase,
  GetPaginatedQueryBaseSchema,
  ResponseListSchemaBase,
  createPaginatedResponseSchema,
} from '@/schemas/base.schema.js';

// ==========================================
// CORE SCHEMA
// ==========================================

export const ModuleSchema = z
  .object({
    id: z.uuidv7(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
    defaultPermissions: z.any().optional().nullable(),
  })
  .extend(AuditFieldsSchema.shape);

// ==========================================
// PARAMS
// ==========================================

export const ModuleParamsSchema = z.object({
  id: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetModulesQuerySchema = GetPaginatedQueryBaseSchema.extend({
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  sortBy: z.string().optional().default('createdAt'),
});

export const GetListQuery = GetListQueryBase;

// ==========================================
// BODIES
// ==========================================

export const CreateModuleBodySchema = ModuleSchema.omit({
  id: true,
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

export const UpdateModuleBodySchema = CreateModuleBodySchema.partial();

export const BulkCreateModuleBodySchema = z.array(CreateModuleBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

// ==========================================
// RESPONSES
// ==========================================

export const ModuleResponseSchema = ModuleSchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const ModulesListResponseSchema = createPaginatedResponseSchema(ModuleSchema);

export const BulkResponseSchema = z.object({
  count: z.number(),
});

// ==========================================
// TYPES INFERIDOS
// ==========================================

export type Module = z.infer<typeof ModuleSchema>;
export type GetModulesQuery = z.infer<typeof GetModulesQuerySchema>;
export type GetListQueryType = z.infer<typeof GetListQuery>;
export type CreateModule = z.infer<typeof CreateModuleBodySchema>;
export type UpdateModule = z.infer<typeof UpdateModuleBodySchema>;
export type ModulesListResponse = z.infer<typeof ModulesListResponseSchema>;
