import { FastifyInstance } from 'fastify/types/instance.js';

import type { IStorageProvider } from '@/modules/storage/interfaces/storage.provider.interface.js';
import { GLOBAL_UPLOAD_RULES } from '@/modules/storage/storage.constants.js';
import { RequestUploadParams } from '@/modules/storage/storage.schema.js';
import { HttpError } from '@/shared/utils/http.error.js';

type Prisma = FastifyInstance['prisma'];

export class StorageService {
  constructor(
    private readonly prisma: Prisma,
    private readonly storage: IStorageProvider,
  ) {}

  async requestUploadUrl(fileData: RequestUploadParams, entityId: string, entityType: string) {
    if (fileData.size > GLOBAL_UPLOAD_RULES.MAX_FILE_SIZE) {
      throw new HttpError(400, 'El archivo excede el tamaño máximo permitido');
    }
    if (!GLOBAL_UPLOAD_RULES.ALLOWED_MIME_TYPES.includes(fileData.mimeType)) {
      throw new HttpError(400, 'Tipo de archivo no soportado');
    }

    const ext = fileData.fileName.split('.').pop();
    const fileKey = `${entityType.toLowerCase()}/${entityId}/${crypto.randomUUID()}.${ext}`;

    try {
      const document = await this.prisma.document.create({
        data: {
          fileName: fileData.fileName,
          fileKey,
          contentType: fileData.mimeType,
          size: fileData.size,
          status: 'PENDING',
          entityType,
          entityId,
        },
      });

      const uploadUrl = await this.storage.generateUploadUrl(fileKey, fileData.mimeType);
      return { uploadUrl, documentId: document.id, fileKey };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async confirmUpload(documentId: string, entityId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityId },
      });

      if (!document) throw new HttpError(404, 'Documento no encontrado');
      if (document.status === 'SUCCESS') return document;

      const exists = await this.storage.checkFileExists(document.fileKey);
      if (!exists) throw new HttpError(400, 'El archivo aún no se ha subido a la nube');

      return this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'SUCCESS' },
      });
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async getPreSignedDownloadUrl(entityId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityId, status: 'SUCCESS' },
      });

      if (!document) throw new HttpError(404, 'Documento no encontrado o pendiente de subida');

      const downloadUrl = await this.storage.generateDownloadUrl(document.fileKey);
      return { downloadUrl, fileName: document.fileName, contentType: document.contentType };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async getDocumentsByEntity(entityId: string) {
    try {
      const documents = await this.prisma.document.findMany({
        where: { entityId, status: 'SUCCESS' },
        select: { id: true, fileName: true, contentType: true, size: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      return { documents };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }
}
