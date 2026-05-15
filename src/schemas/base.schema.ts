import { string, z } from 'zod';

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
