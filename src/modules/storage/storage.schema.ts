import { z } from 'zod';

// --- Base Atoms (DRY) ---
const entityId = z.uuid();
const entityType = z.string().min(1);
const documentId = z.uuid();

// --- Reusable Base Schemas ---
export const EntityParamsSchema = z.object({
  entityId,
  entityType,
});

export const ConfirmParamsSchema = EntityParamsSchema.extend({
  documentId,
});

// --- Request Schemas ---
export const RequestUploadBodySchema = z.object({
  fileData: z.object({
    fileName: z.string().min(1),
    mimeType: z.string().includes('/'),
    size: z.number().positive(),
  }),
});

// --- Response Schemas ---

export const ResponseUploadSchema = z.object({
  uploadUrl: z.string().url(),
  documentId,
  fileKey: z.string(),
});

export const ResponseStatusChangeSchema = z.object({
  id: documentId,
  status: z.enum(['SUCCESS', 'TRASHED', 'PENDING']),
  fileName: z.string(),
});

export const ResponseDownloadSchema = z.object({
  downloadUrl: z.string().url(),
  contentType: z.string(),
  fileName: z.string(),
});

const DocumentItemSchema = z.object({
  id: documentId,
  contentType: z.string(),
  fileName: z.string(),
  size: z.number().int(),
  createdAt: z.date(),
});

export const ResponseDocuments = z.object({
  documents: z.array(DocumentItemSchema),
});

export const ResponseDeleteSchema = z.object({
  id: z.uuid(),
  message: z.string(),
});

// --- Querying Schemas

export const GetDocumentsQuerySchema = z.object({
  isTrash: z
    .preprocess((val) => val === 'true', z.boolean())
    .optional()
    .default(false),
});

// --- Types ---
export type RequestUploadParams = z.infer<typeof RequestUploadBodySchema>['fileData'];
export type EntityParams = z.infer<typeof EntityParamsSchema>;
export type ConfirmParams = z.infer<typeof ConfirmParamsSchema>;
export type GetDocumentsQuery = z.infer<typeof GetDocumentsQuerySchema>;
