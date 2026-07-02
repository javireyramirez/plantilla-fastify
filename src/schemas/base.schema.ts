import { z } from 'zod';

export const CreateSchema = z
  .object({
    ownerId: z.uuidv7().optional(),
  })
  .loose();

export const OwnerSchema = z.object({
  name: z.string(),
  email: z.email(),
});

export const UserSchemaBase = z.object({
  name: z.string(),
  email: z.email(),
});

export const TeamSchemaBase = z.object({
  name: z.string(),
});

export const RoleSchemaBase = z.object({
  name: z.string(),
});

export const GetListQueryBase = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  name: z.string().optional(),
});

export const ResponseListSchemaBase = z.array(
  z.object({
    id: z.uuidv7(),
    name: z.string(),
  }),
);

export const recordStatusSchema = z.enum([
  'ACTIVE',
  'PENDING',
  'TRASHED',
  'INACTIVE',
  'ARCHIVED',
  'SUSPENDED',
]);

export const AuditFieldsSchema = z.object({
  status: recordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  restoredAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoredBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});

export const GetPaginatedQueryBaseSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  name: z.string().optional(),
  createdAtFrom: z
    .preprocess((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) ? new Date(val as string) : new Date(num);
    }, z.date().optional())
    .optional(),
  createdAtTo: z
    .preprocess((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) ? new Date(val as string) : new Date(num);
    }, z.date().optional())
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const dateQueryBase = z
  .preprocess((val) => {
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) ? new Date(val as string) : new Date(num);
  }, z.date().optional())
  .optional();

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });
}

export const ExportFormatSchema = z.enum(['csv', 'excel', 'json']);

export const ExportRequestSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string()).optional(),
  format: ExportFormatSchema.default('csv'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isTrash: z.boolean().optional().default(false),
});
