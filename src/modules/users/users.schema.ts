import { z } from 'zod';

import {
  GetListQueryBase,
  GetPaginatedQueryBaseSchema,
  ResponseListSchemaBase,
  createPaginatedResponseSchema,
} from '@/schemas/base.schema.js';

export const ResponseTeamRoleSchemaBase = z.object({
  id: z.uuidv7(),
  name: z.string(),
});

// ==========================================
// SCHEMA BASE
// ==========================================

export const UsersSchema = z.object({
  id: z.uuidv7(),
  email: z.email().nullable().optional(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
  emailVerified: z.boolean(),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  isSuperAdmin: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const sessionSchema = z.object({
  id: z.uuidv7(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  isValid: z.boolean(),
});

// ==========================================
// PARAMS
// ==========================================

export const UsersIdParamsSchema = z.object({
  id: z.uuidv7(),
});

// ==========================================
// QUERIES
// ==========================================

export const GetUsersQuerySchema = GetPaginatedQueryBaseSchema.extend({
  // En users "isTrash" = usuarios inactivos (isActive: false)
  isSystem: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      return v === 'true' || v === true;
    }, z.boolean().optional())
    .optional(),
  isActive: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      return v === 'true' || v === true;
    }, z.boolean().optional())
    .optional(),
  emailVerified: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      return v === 'true' || v === true;
    }, z.boolean().optional())
    .optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).optional().default('createdAt'),
});

export const GetListQuery = GetListQueryBase;

export const GetUserAssignmentsQuerySchema = GetPaginatedQueryBaseSchema.extend({
  sortBy: z.enum(['name']).optional().default('name'),
});

// ==========================================
// BODIES
// ==========================================

export const CreateUsersBodySchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(255).optional(),
});

export const UpdateUsersBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.url().nullable().optional(),
});

export const BulkCreateUsersBodySchema = z.array(CreateUsersBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()).min(1),
});

export const UpdateUserRolesBodySchema = z.object({
  roles: z.array(z.uuidv7()).min(1),
});

export const UpdateUserTeamsBodySchema = z.object({
  teams: z.array(z.uuidv7()).min(1),
});

// ==========================================
// RESPONSES
// ==========================================

export const UsersResponseSchema = UsersSchema;

export const UsersListResponseSchema = createPaginatedResponseSchema(UsersSchema);

export const BulkResponseSchema = z.object({
  count: z.number(),
});

export const ResponseListSchema = ResponseListSchemaBase;

export const ResponseMessageSchema = z.object({
  message: z.string(),
});

export const UserRolesPaginatedResponseSchema = createPaginatedResponseSchema(
  ResponseTeamRoleSchemaBase,
);
export const UserTeamsPaginatedResponseSchema = createPaginatedResponseSchema(
  ResponseTeamRoleSchemaBase,
);

// ==========================================
// TYPES
// ==========================================

export type Users = z.infer<typeof UsersSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CreateUsers = z.infer<typeof CreateUsersBodySchema>;
export type UpdateUsers = z.infer<typeof UpdateUsersBodySchema>;
export type GetUsersQuery = z.infer<typeof GetUsersQuerySchema>;
export type UpdateUserRolesBody = z.infer<typeof UpdateUserRolesBodySchema>;
export type UpdateUserTeamsBody = z.infer<typeof UpdateUserTeamsBodySchema>;
