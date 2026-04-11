import { z } from 'zod';

export const EntityIdParamsSchema = z.object({
  entityId: z.uuid(),
});

export const EntityParamsSchema = z.object({
  entityId: z.uuid(),
  entityType: z.string().min(1),
});

export const ConfirmParamsSchema = z.object({
  entityId: z.uuid(),
  documentId: z.uuid(),
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

export const ResponseConfirmSchema = z.object({
  id: z.uuid(),
  status: z.literal('SUCCESS'),
  fileName: z.string(),
});

export const ResponseDownloadSchema = z.object({
  downloadUrl: z.url(),
  contentType: z.string(),
  fileName: z.string(),
});

export const ResponseDocuments = z.object({
  id: z.uuid(),
  contentType: z.string(),
  fileName: z.string(),
  size: z.number(),
  createdAt: z.date(),
});

export type RequestUploadParams = z.infer<typeof RequestUploadBodySchema>['fileData'];
export type EntityParams = z.infer<typeof EntityParamsSchema>;
export type EntityIdParams = z.infer<typeof EntityIdParamsSchema>;
export type ConfirmParams = z.infer<typeof ConfirmParamsSchema>;
