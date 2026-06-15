import { z } from 'zod';

import { GetListQueryBase, ResponseListSchemaBase } from '@/schemas/base.schema.js';

// ==========================================
// SCHEMA BASE (refleja auth_users real)
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

export const GetUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),

  // En users "isTrash" = usuarios inactivos (isActive: false)
  isTrash: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),

  // Filtros
  search: z.string().optional(), // búsqueda por name o email
  isSystem: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === '') return undefined;
      return v === 'true' || v === true;
    }, z.boolean().optional())
    .optional(),
  isSuperAdmin: z
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

  createdAtFrom: z
    .preprocess((v) => {
      if (!v) return undefined;
      const n = Number(v);
      return isNaN(n) ? new Date(v as string) : new Date(n);
    }, z.date())
    .optional(),
  createdAtTo: z
    .preprocess((v) => {
      if (!v) return undefined;
      const n = Number(v);
      return isNaN(n) ? new Date(v as string) : new Date(n);
    }, z.date())
    .optional(),

  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const GetListQuery = GetListQueryBase;

// ==========================================
// BODIES
// ==========================================

/**
 * Crear usuario: solo email y nombre.
 * La contraseña NO se recibe — se enviará un email de establecimiento.
 */
export const CreateUsersBodySchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(255).optional(),
  isSuperAdmin: z.boolean().optional().default(false),
});

/**
 * Actualizar usuario: campos editables por un admin.
 * No se puede cambiar email ni contraseña desde aquí.
 */
export const UpdateUsersBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
});

export const BulkCreateUsersBodySchema = z.array(CreateUsersBodySchema);

export const BulkIdsBodySchema = z.object({
  ids: z.array(z.uuidv7()).min(1),
});

// ==========================================
// RESPONSES
// ==========================================

export const UsersResponseSchema = UsersSchema;

export const UsersListResponseSchema = z.object({
  data: z.array(UsersSchema),
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

export const ResponseListSchema = ResponseListSchemaBase;

export const ResponseMessageSchema = z.object({
  message: z.string(),
});

// ==========================================
// TYPES
// ==========================================

export type Users = z.infer<typeof UsersSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CreateUsers = z.infer<typeof CreateUsersBodySchema>;
export type UpdateUsers = z.infer<typeof UpdateUsersBodySchema>;
export type GetUsersQuery = z.infer<typeof GetUsersQuerySchema>;
