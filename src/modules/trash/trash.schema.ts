import { z } from 'zod';

import { createPaginatedResponseSchema, dateQueryBase } from '@/schemas/base.schema.js';

export const GetTrashQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.enum(['entities', 'documents']).default('entities'),
  sortBy: z
    .enum(['deletedAt', 'expiresAt', 'deletedAt', 'displayName', 'moduleSlug'])
    .default('deletedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  moduleId: z.uuidv7().optional(),
  deletedAtFrom: dateQueryBase,
  deletedAtTo: dateQueryBase,
  expiresAtFrom: dateQueryBase,
  expiresAtTo: dateQueryBase,
});

export const TrashBinItemSchema = z.object({
  id: z.uuidv7(),
  moduleId: z.uuidv7(),
  moduleSlug: z.string(),
  entityId: z.string(),
  displayName: z.string(),
  deletedAt: z.coerce.date(),
  deletedBy: z.string().nullable(),
  deletedByName: z.string().nullable().optional(),
  deletedByEmail: z.string().nullable().optional(),
  deletor: z
    .object({
      name: z.string().nullable(),
      email: z.email(),
    })
    .nullable()
    .optional(),
  expiresAt: z.coerce.date(),
  ownerId: z.string().nullable(),
  createdBy: z.string().nullable(),
  metadata: z.any().nullable().optional(),
});

export const TrashListResponseSchema = createPaginatedResponseSchema(TrashBinItemSchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const BulkResponseSchema = z.object({
  count: z.number(),
});

export type GetTrashQuery = z.infer<typeof GetTrashQuerySchema>;
