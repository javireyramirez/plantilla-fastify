import { z } from 'zod';

import {
  GetListQueryBase,
  OwnerSchema,
  OwnerTeamSchema,
  ResponseListSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

export const ModuleSchema = z.object({
  id: z.uuidv7(),
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  defaultPermissions: z.any().optional().nullable(),

  status: recordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  restoreAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),

  owner: OwnerSchema.optional().nullable(),
  ownerTeam: OwnerTeamSchema.optional().nullable(),
});

// PARAMS
export const ModuleKeyParamsSchema = z.object({
  id: z.uuidv7(),
});

// QUERIES
export const GetModulesQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),

  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  label: z.string().optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),

  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetListQuery = GetListQueryBase;

// BODIES
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
}).extend({
  ownerId: z.string().optional().nullable(),
  ownerTeamId: z.string().optional().nullable(),
});

export const UpdateModuleBodySchema = CreateModuleBodySchema.partial();

export const BulkCreateModuleBodySchema = z.array(CreateModuleBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

// RESPONSES
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

// TYPES
export type Module = z.infer<typeof ModuleSchema>;
export type CreateModule = z.infer<typeof CreateModuleBodySchema>;
export type UpdateModule = z.infer<typeof UpdateModuleBodySchema>;
