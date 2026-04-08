import { z } from 'zod';

export const EntityParamsSchema = z.object({
  entityId: z.uuid(),
  entityType: z.string().min(1),
});

export const RequestUploadBodySchema = z.object({
  fileData: z.object({
    fileName: z.string().min(1),
    mimeType: z.string().includes('/'),
    size: z.number().positive(),
  }),
});

export const ResponseUploadSchema = z.object({
  uploadUrl: z.string(),
  documentId: z.string(),
  fileKey: z.string(),
});

export type RequestUploadParams = z.infer<typeof RequestUploadBodySchema>['fileData'];
export type EntityParams = z.infer<typeof EntityParamsSchema>;
