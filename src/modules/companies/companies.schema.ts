import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.cuid(),
  name: z.string().min(1),
  nif: z.string().min(1),

  sector: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),

  status: z.string(),

  createdAt: z.date(),
  updatedAt: z.date(),

  ownerId: z.string().optional().nullable(),
  ownerTeamId: z.string().optional().nullable(),
  ownerOrganizationId: z.string().optional().nullable(),
});

/**
 * PARAMS
 */
export const CompanyIdParamsSchema = z.object({
  id: z.cuid(),
});

/**
 * QUERIES
 */
export const GetCompaniesQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),

  isTrash: z.coerce.boolean().optional().default(false),

  name: z.string().optional(),
  sector: z.string().optional(),

  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * BODIES
 */
export const CreateCompanyBodySchema = CompanySchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCompanyBodySchema = CreateCompanyBodySchema.partial();

/**
 * RESPONSES
 */
export const CompanyResponseSchema = CompanySchema;

export const CompaniesListResponseSchema = z.object({
  data: z.array(CompanySchema),

  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const CompanyDeletedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/**
 * TYPES
 */
export type Company = z.infer<typeof CompanySchema>;

export type CreateCompany = z.infer<typeof CreateCompanyBodySchema>;

export type UpdateCompany = z.infer<typeof UpdateCompanyBodySchema>;
