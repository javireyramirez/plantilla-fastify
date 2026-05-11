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
    isPublic: z.boolean().default(false),
  }),
});

export const UpdateMetadataSchema = z.object({
  fileName: z.string().min(1),
  isPublic: z.boolean().default(false),
});

export const BulkActionSchema = z.object({
  documentIds: z.array(documentId),
});

// --- Response Schemas ---

export const ResponseUploadSchema = z.object({
  uploadUrl: z.url(),
  documentId,
  fileKey: z.string(),
});

export const ResponseStatusChangeSchema = z.object({
  id: documentId,
  status: z.enum(['SUCCESS', 'TRASHED', 'PENDING']),
  fileName: z.string(),
});

export const BulkUpdateResponseSchema = z.object({
  count: z.number(),
});

export const ResponseDownloadSchema = z.object({
  downloadUrl: z.url(),
  contentType: z.string(),
  fileName: z.string(),
});

export const ResponseDownloadBulkSchema = z.array(ResponseDownloadSchema);

export const DocumentItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  status: z.string(),
  isPublic: z.boolean().default(false),
  createdAt: z.coerce.date(),
  createdBy: z.string().nullable().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  deletedBy: z.string().nullable().optional(),
  restoreAt: z.coerce.date().nullable().optional(),
  restoreBy: z.string().nullable().optional(),
});

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  sortBy: z.enum(['fileName', 'createdAt', 'size', 'contentType', 'deletedAt']),
  sortOrder: z.enum(['asc', 'desc']),
});

export const ResponseDocuments = z.object({
  documents: z.array(DocumentItemSchema),
  meta: PaginationMetaSchema,
});

export const ResponseDeleteSchema = z.object({
  id: z.uuid(),
  message: z.string(),
});

// --- Querying Schemas

export const GetDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  fileName: z.string().optional(),

  contentTypes: z
    .preprocess((val) => {
      if (typeof val === 'string') return [val];
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.string()))
    .optional(),

  sizeMin: z.coerce.number().int().nonnegative().optional(),
  sizeMax: z.coerce.number().int().nonnegative().optional(),

  createdFrom: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),
  createdTo: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),
  deletedFrom: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),
  deletedTo: z.coerce
    .number()
    .transform((v) => new Date(v))
    .pipe(z.date())
    .optional(),

  createdBy: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      return val;
    }, z.array(z.string()))
    .optional(),

  deletedBy: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.split(',');
      return val;
    }, z.array(z.string()))
    .optional(),

  isTrash: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  sortBy: z
    .enum(['fileName', 'createdAt', 'size', 'contentType', 'deletedAt'])
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// --- Types ---
export type RequestUploadParams = z.infer<typeof RequestUploadBodySchema>['fileData'];
export type EntityParams = z.infer<typeof EntityParamsSchema>;
export type ConfirmParams = z.infer<typeof ConfirmParamsSchema>;
export type GetDocumentsQuery = z.infer<typeof GetDocumentsQuerySchema>;
export type UpdateMetadata = z.infer<typeof UpdateMetadataSchema>;
export type BulkAction = z.infer<typeof BulkActionSchema>;
