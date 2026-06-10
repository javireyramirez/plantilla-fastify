import { z } from 'zod';

import {
  GetListQueryBase,
  OrganizationSchemaBase,
  ResponseListSchemaBase,
  UserSchemaBase,
  recordStatusSchema,
} from '@/schemas/base.schema.js';

// ==========================================
// BASE SCHEMAS
// ==========================================

export const TeamSchema = z.object({
  id: z.uuidv7(),
  organizationId: z.uuidv7(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  status: recordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  deletedBy: z.string().optional().nullable(),
  restoreBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
});

export const TeamMemberSchemaBase = z.object({
  id: z.uuidv7(),
  teamId: z.uuidv7(),
  memberId: z.uuidv7(),
  joinedAt: z.date(),
  invitedBy: z.string().optional().nullable(),
  removedBy: z.string().optional().nullable(),
  roleUpdatedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================

export const TeamIdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const TeamMemberIdParamsSchema = z.object({
  id: z.uuidv7(),
  memberId: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetTeamQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  name: z.string().optional(),
  organizationId: z.union([z.uuidv7(), z.array(z.uuidv7())]).optional(),
  createdAtFrom: z
    .preprocess((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : new Date(num);
    }, z.date())
    .optional(),

  createdAtTo: z
    .preprocess((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : new Date(num);
    }, z.date())
    .optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetTeamMembersQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default('joinedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  joinedFrom: z.string().datetime().optional(),
  joinedTo: z.string().datetime().optional(),
});

export const GetListQuery = GetListQueryBase;

// ==========================================
// BODIES
// ==========================================

export const CreateTeamBodySchema = TeamSchema.omit({
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

export const UpdateTeamBodySchema = CreateTeamBodySchema.partial();

export const BulkCreateTeamBodySchema = z.array(CreateTeamBodySchema).min(1);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const CreateTeamMemberSchema = TeamMemberSchemaBase.pick({
  memberId: true,
});

export const BulkMemberIdsBodySchema = z.object({
  memberIds: z.array(z.uuidv7()).min(1),
});

// ==========================================
// RESPONSES
// ==========================================

export const TeamResponseSchema = TeamSchema.extend({
  organization: OrganizationSchemaBase.optional(),
});

export const ResponseListSchema = ResponseListSchemaBase;

export const TeamListResponseSchema = z.object({
  data: z.array(TeamResponseSchema),
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

export const TeamMemberResponseSchema = TeamMemberSchemaBase.extend({
  member: z
    .object({
      id: z.uuidv7(),
      userId: z.uuidv7(),
      isActive: z.boolean(),
      joinedAt: z.date(),
      user: UserSchemaBase.optional(),
    })
    .optional(),
  team: TeamSchema.optional(),
});

export const TeamMemberListResponseSchema = z.object({
  data: z.array(TeamMemberResponseSchema),
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

export type Team = z.infer<typeof TeamSchema>;
export type CreateTeam = z.infer<typeof CreateTeamBodySchema>;
export type UpdateTeam = z.infer<typeof UpdateTeamBodySchema>;
export type TeamMember = z.infer<typeof TeamMemberSchemaBase>;
export type CreateTeamMember = z.infer<typeof CreateTeamMemberSchema>;
export type GetTeamMembersQuery = z.infer<typeof GetTeamMembersQuerySchema>;
