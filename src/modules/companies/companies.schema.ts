import { z } from 'zod';

import { OwnerOrganizationSchema, OwnerSchema, OwnerTeamSchema } from '@/schemas/base.schema.js';

export const CompanySchema = z.object({
  id: z.cuid(),
  name: z.string().min(1),
  nif: z.string().min(1),
  sector: z.string().optional().nullable(),
  website: z.url().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // IDs (FKs)
  ownerId: z.string().optional().nullable(),
  ownerTeamId: z.string().optional().nullable(),
  ownerOrganizationId: z.string().optional().nullable(),
  // Relaciones expandidas
  owner: OwnerSchema.optional().nullable(),
  ownerTeam: OwnerTeamSchema.optional().nullable(),
  ownerOrganization: OwnerOrganizationSchema.optional().nullable(),
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
 * BULK SCHEMAS (Añadir estos)
 */

// Para el POST /bulk (Crear muchos)
export const BulkCreateCompanyBodySchema = z.array(CreateCompanyBodySchema);

// Para los DELETE y PATCH /bulk (IDs masivos)
export const BulkIdsBodySchema = z.object({
  ids: z.array(z.string().cuid()),
});

// Respuesta estándar de Prisma para operaciones masivas (updateMany, deleteMany, createMany)
export const BulkResponseSchema = z.object({
  count: z.number(),
});

/**
 * AJUSTES EN RESPONSES
 */

// Para que el delete individual no pete si devuelves el objeto borrado
export const CompanyDeleteResponseSchema = CompanySchema;

// Para el restore
export const CompanyRestoreResponseSchema = CompanySchema;

/**
 * TYPES
 */
export type Company = z.infer<typeof CompanySchema>;

export type CreateCompany = z.infer<typeof CreateCompanyBodySchema>;

export type UpdateCompany = z.infer<typeof UpdateCompanyBodySchema>;
