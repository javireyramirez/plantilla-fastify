import { z } from 'zod';

import { recordStatusSchema } from '@/schemas/base.schema.js';

export const OrganizationSchema = z.object({
  id: z.cuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.date().optional().nullable(),

  status: recordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});

// PARAMS
export const OrganizationIdParamsSchema = z.object({
  id: z.cuid(),
});

// QUERIES
export const GetCompaniesQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),

  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  name: z.string().optional(),
  sector: z.string().optional(),

  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// BODIES
export const CreateOrganizationBodySchema = OrganizationSchema.omit({
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

export const UpdateOrganizationBodySchema = CreateOrganizationBodySchema.partial();

export const BulkCreateOrganizationBodySchema = z.array(CreateOrganizationBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.cuid()),
});

// RESPONSES
export const OrganizationResponseSchema = OrganizationSchema;

export const CompaniesListResponseSchema = z.object({
  data: z.array(OrganizationSchema),

  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const OrganizationDeletedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const BulkResponseSchema = z.object({
  count: z.number(),
});

export const OrganizationDeleteResponseSchema = OrganizationSchema;

export const OrganizationRestoreResponseSchema = OrganizationSchema;

// TYPES
export type Organization = z.infer<typeof OrganizationSchema>;

export type CreateOrganization = z.infer<typeof CreateOrganizationBodySchema>;

export type UpdateOrganization = z.infer<typeof UpdateOrganizationBodySchema>;
