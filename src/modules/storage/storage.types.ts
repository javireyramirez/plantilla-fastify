export interface RequestUploadParams {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface EntityParams {
  entityId: string;
  entityType: string;
}

export interface DocumentParams extends EntityParams {
  documentId: string;
}
