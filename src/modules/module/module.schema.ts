// @/modules/modules/model/modules.schema.ts
import { z } from 'zod';

import {
  GetListQueryBase,
  ResponseListSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

// ==========================================
// CORE SCHEMA
// ==========================================
export const ModuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  defaultPermissions: z.any().optional().nullable(),

  // Auditoría Unificada
  status: recordStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().optional().nullable(),
  restoreAt: z.coerce.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================
export const ModuleParamsSchema = z.object({
  id: z.string().uuid(),
});

// ==========================================
// QUERIES
// ==========================================
export const GetModulesQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),

  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  name: z.string().optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),

  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
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
  ids: z.array(z.string().uuid()),
});

// ==========================================
// RESPONSES
// ==========================================
export const ModuleResponseSchema = ModuleSchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const ModulesListResponseSchema = z.object({
  data: z.array(ModuleSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

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
