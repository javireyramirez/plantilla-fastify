import { z } from 'zod';

import {
  GetListQueryBase,
  GetPaginatedQueryBaseSchema,
  createPaginatedResponseSchema,
} from '@/schemas/base.schema.js';

export const AuditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'SOFT_DELETE',
  'RESTORE',
  'HARD_DELETE',
  'LOGIN',
  'LOGOUT',
]);

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  action: AuditActionSchema,
  moduleId: z.string().nullable().optional(),
  moduleSlug: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  createdAt: z.date(),
  user: z
    .object({
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

// PARAMS
export const AuditLogIdParamsSchema = z.object({
  id: z.string(),
});

// QUERIES
export const GetAuditLogsQuerySchema = GetPaginatedQueryBaseSchema.extend({
  action: AuditActionSchema.optional(),
  moduleSlug: z.string().optional(),
  entityId: z.string().optional(),
  userId: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  user: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),
  sortBy: z.enum(['createdAt', 'action', 'moduleSlug']).optional().default('createdAt'),
});

export const GetListQuery = GetListQueryBase.extend({
  sortBy: z.string().optional().default('createdAt'),
});

// RESPONSES
export const AuditLogResponseSchema = AuditLogSchema;
export const AuditLogsListResponseSchema = createPaginatedResponseSchema(AuditLogSchema);
export const ResponseListSchema = z.array(
  z.object({
    id: z.string(),
    displayName: z.string().nullable().optional(),
    createdAt: z.date(),
  }),
);

export type AuditLogType = z.infer<typeof AuditLogSchema>;
