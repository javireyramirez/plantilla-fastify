import { z } from 'zod';

import {
  AuditFieldsSchema,
  GetListQueryBase,
  GetPaginatedQueryBaseSchema,
  ResponseListSchemaBase,
  UserSchemaBase,
  createPaginatedResponseSchema,
  dateQueryBase,
} from '@/schemas/base.schema.js';

// ==========================================
// BASE SCHEMAS
// ==========================================

export const TeamSchema = z
  .object({
    id: z.uuidv7(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional().nullable(),
  })
  .extend(AuditFieldsSchema.shape);

export const TeamUserSchemaBase = z.object({
  id: z.uuidv7(),
  teamId: z.uuidv7(),
  userId: z.uuidv7(),
  joinedAt: z.date(),
  invitedBy: z.string().optional().nullable(),
});

// ==========================================
// PARAMS
// ==========================================

export const TeamIdParamsSchema = z.object({
  id: z.uuidv7(),
});

export const TeamuserIdParamsSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetTeamQuerySchema = GetPaginatedQueryBaseSchema.extend({
  sortBy: z.string().optional().default('createdAt'),
});

export const GetTeamUsersQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default('joinedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  joinedFrom: dateQueryBase.optional(),
  joinedTo: dateQueryBase.optional(),
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
  restoredAt: true,
  createdBy: true,
  deletedBy: true,
  restoredBy: true,
  updatedBy: true,
});

export const UpdateTeamBodySchema = CreateTeamBodySchema.partial();

export const BulkCreateTeamBodySchema = z.array(CreateTeamBodySchema).min(1);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()),
});

export const CreateTeamUserSchema = TeamUserSchemaBase.pick({
  userId: true,
});

export const BulkuserIdsBodySchema = z.object({
  userIds: z.array(z.uuidv7()).min(1),
});

// ==========================================
// RESPONSES
// ==========================================

export const TeamResponseSchema = TeamSchema;

export const ResponseListSchema = ResponseListSchemaBase;

export const TeamListResponseSchema = createPaginatedResponseSchema(TeamResponseSchema);

export const BulkResponseSchema = z.object({
  count: z.number(),
});

// Se mapea idéntico a los includes habituales de Prisma para relaciones
export const TeamUserResponseSchema = TeamUserSchemaBase.extend({
  user: UserSchemaBase.optional(), // include: { user: true }
  team: TeamSchema.optional(), // include: { team: true }
});

export const TeamUserListResponseSchema = createPaginatedResponseSchema(TeamUserResponseSchema);

export const GetTeamAssignmentsQuerySchema = GetPaginatedQueryBaseSchema.extend({
  sortBy: z.enum(['name']).optional().default('name'),
});

export const UpdateTeamRolesBodySchema = z.object({
  roles: z.array(z.uuidv7()).min(1),
});

export const TeamRolesPaginatedResponseSchema = createPaginatedResponseSchema(
  z.object({
    id: z.uuidv7(),
    name: z.string(),
    assignedAt: z.date(),
  }),
);

// ==========================================
// TYPES
// ==========================================

export type Team = z.infer<typeof TeamSchema>;
export type CreateTeam = z.infer<typeof CreateTeamBodySchema>;
export type UpdateTeam = z.infer<typeof UpdateTeamBodySchema>;
export type TeamUser = z.infer<typeof TeamUserSchemaBase>;
export type CreateTeamUser = z.infer<typeof CreateTeamUserSchema>;
export type GetTeamUsersQuery = z.infer<typeof GetTeamUsersQuerySchema>;
export type UpdateTeamRolesBody = z.infer<typeof UpdateTeamRolesBodySchema>;
export type GetTeamAssignmentsQuery = z.infer<typeof GetTeamAssignmentsQuerySchema>;
