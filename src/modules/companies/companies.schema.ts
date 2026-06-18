import { z } from 'zod';

import {
  AuditFieldsSchema,
  GetListQueryBase,
  GetPaginatedQueryBaseSchema,
  OwnerSchema,
  ResponseListSchemaBase,
  createPaginatedResponseSchema,
} from '@/schemas/base.schema.js';

export const CompanySchema = z
  .object({
    id: z.uuidv7(),
    name: z.string().min(1),
    nif: z.string().min(1),
    sector: z.string().optional().nullable(),
    website: z.url().optional().nullable(),
    owner: OwnerSchema.optional().nullable(),
  })
  .extend(AuditFieldsSchema.omit({ restoredAt: true }).shape);

// PARAMS
export const CompanyIdParamsSchema = z.object({
  id: z.uuidv7(),
});

// QUERIES
export const GetCompaniesQuerySchema = GetPaginatedQueryBaseSchema.extend({
  nif: z.string().optional(),
  sector: z
    .preprocess((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }, z.array(z.string()))
    .optional(),
  sortBy: z.enum(['name', 'nif', 'sector', 'createdAt']).optional().default('createdAt'),
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
  restoredBy: true,
  updatedBy: true,
}).extend({
  ownerId: z.string().optional().nullable(),
});

export const UpdateCompanyBodySchema = CreateCompanyBodySchema.partial();

export const BulkCreateCompanyBodySchema = z.array(CreateCompanyBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

// RESPONSES
export const CompanyResponseSchema = CompanySchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const CompaniesListResponseSchema = createPaginatedResponseSchema(CompanySchema);

export const BulkResponseSchema = z.object({
  count: z.number(),
});

export const CompanyDeleteResponseSchema = CompanySchema;

export const CompanyRestoreResponseSchema = CompanySchema;

// TYPES
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompany = z.infer<typeof CreateCompanyBodySchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanyBodySchema>;
