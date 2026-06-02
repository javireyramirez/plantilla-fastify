import { z } from 'zod';

import {
  GetListQueryBase,
  OwnerOrganizationSchema,
  OwnerSchema,
  OwnerTeamSchema,
  ResponseListSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

export const CompanySchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  nif: z.string().min(1),
  sector: z.string().optional().nullable(),
  website: z.url().optional().nullable(),

  status: recordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),

  owner: OwnerSchema.optional().nullable(),
  ownerTeam: OwnerTeamSchema.optional().nullable(),
  ownerOrganization: OwnerOrganizationSchema.optional().nullable(),
});

// PARAMS
export const CompanyIdParamsSchema = z.object({
  id: z.uuidv7(),
});

// QUERIES
export const GetCompaniesQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  name: z.string().optional(),
  nif: z.string().optional(),

  sector: z
    .preprocess((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }, z.array(z.string()))
    .optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional(),
  sortBy: z.enum(['name', 'nif', 'sector', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetListQuery = GetListQueryBase;

// BODIES
export const CreateCompanyBodySchema = CompanySchema.omit({
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

export const UpdateCompanyBodySchema = CreateCompanyBodySchema.partial();

export const BulkCreateCompanyBodySchema = z.array(CreateCompanyBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

// RESPONSES
export const CompanyResponseSchema = CompanySchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const CompaniesListResponseSchema = z.object({
  data: z.array(CompanySchema),

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

export const CompanyDeleteResponseSchema = CompanySchema;

export const CompanyRestoreResponseSchema = CompanySchema;

// TYPES
export type Company = z.infer<typeof CompanySchema>;

export type CreateCompany = z.infer<typeof CreateCompanyBodySchema>;

export type UpdateCompany = z.infer<typeof UpdateCompanyBodySchema>;
