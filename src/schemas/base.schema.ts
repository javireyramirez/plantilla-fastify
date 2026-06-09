import { z } from 'zod';

export const CreateSchema = z
  .object({
    ownerId: z.uuidv7().optional(),
    ownerTeamId: z.uuidv7().optional(),
    ownerOrganizationId: z.uuidv7().optional(),
  })
  .loose();

export const OwnerSchema = z.object({
  name: z.string(),
  email: z.email(),
});

export const OwnerTeamSchema = z.object({
  name: z.string(),
});

export const OwnerOrganizationSchema = z.object({
  name: z.string(),
});

export const UserSchemaBase = z.object({
  name: z.string(),
  email: z.email(),
});

export const OrganizationSchemaBase = z.object({
  name: z.string(),
});

export const TeamSchemaBase = z.object({
  name: z.string(),
});

export const RoleSchemaBase = z.object({
  name: z.string(),
});

export const GetListQueryBase = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  name: z.string().optional(),
});

export const ResponseListSchemaBase = z.array(
  z.object({
    id: z.uuidv7(),
    name: z.string(),
  }),
);

export const recordStatusSchema = z.enum([
  'ACTIVE',
  'PENDING',
  'TRASHED',
  'INACTIVE',
  'ARCHIVED',
  'SUSPENDED',
]);
