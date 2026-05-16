import { z } from 'zod';

export const CreateSchema = z
  .object({
    ownerId: z.string().optional(),
    ownerTeamId: z.string().optional(),
    ownerOrganizationId: z.string().optional(),
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
