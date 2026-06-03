import { z } from 'zod';

import {
  GetListQueryBase,
  OrganizationSchemaBase,
  OwnerOrganizationSchema,
  OwnerSchema,
  OwnerTeamSchema,
  ResponseListSchemaBase,
  UserSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

// ==========================================
// BASE SCHEMAS
// ==========================================

export const OrganizationSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string().optional().nullable(),
  status: recordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});

export const OrganizationMemberSchemaBase = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  organizationId: z.uuidv7(),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(true),
  joinedAt: z.date(),
  updatedAt: z.date(),
  // Auditoría de membresía
  invitedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================

export const OrganizationIdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const MemberUserIdParamsSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetOrganizationQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  name: z.string().optional(),
  sector: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetMembersQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default('joinedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  joinedFrom: z.string().datetime().optional(),
  joinedTo: z.string().datetime().optional(),
});

export const GetListQuery = GetListQueryBase;

// ==========================================
// BODIES
// ==========================================

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
});

export const UpdateOrganizationBodySchema = CreateOrganizationBodySchema.partial();

export const BulkCreateOrganizationBodySchema = z.array(CreateOrganizationBodySchema).min(1);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const CreateMemberSchema = OrganizationMemberSchemaBase.pick({
  userId: true,
});

export const ToggleMemberStatusSchema = OrganizationMemberSchemaBase.pick({
  isActive: true,
});

export const BulkMemberIdsBodySchema = z.object({
  userIds: z.array(z.uuidv7()).min(1),
});

export const BulkToggleMemberStatusSchema = BulkMemberIdsBodySchema.extend({
  isActive: z.boolean(),
});

// ==========================================
// RESPONSES
// ==========================================

export const OrganizationResponseSchema = OrganizationSchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const OrganizationListResponseSchema = z.object({
  data: z.array(OrganizationSchema),
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

export const OrganizationDeleteResponseSchema = OrganizationSchema;
export const OrganizationRestoreResponseSchema = OrganizationSchema;

export const OrganizationMemberResponseSchema = OrganizationMemberSchemaBase.extend({
  user: UserSchemaBase.optional(),
  organization: OrganizationSchemaBase.optional(),
});

export const MemberListResponseSchema = z.object({
  data: z.array(OrganizationMemberResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// ==========================================
// TYPES
// ==========================================

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganization = z.infer<typeof CreateOrganizationBodySchema>;
export type UpdateOrganization = z.infer<typeof UpdateOrganizationBodySchema>;
export type OrganizationMember = z.infer<typeof OrganizationMemberSchemaBase>;
export type CreateMember = z.infer<typeof CreateMemberSchema>;
export type BulkToggleMemberStatus = z.infer<typeof BulkToggleMemberStatusSchema>;
export type GetMembersQuery = z.infer<typeof GetMembersQuerySchema>;
