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
          isPublic: fileData.isPublic,
        },
      });

      const uploadUrl = await this.storage.generateUploadUrl(fileKey, fileData.mimeType);
      return { uploadUrl, documentId: document.id, fileKey };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async confirmUpload(entityType: string, entityId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityType, entityId },
      });

      if (!document) throw new HttpError(404, 'Documento no encontrado');
      if (document.status === 'SUCCESS') return document;

      const exists = await this.storage.checkFileExists(document.fileKey);
      if (!exists) throw new HttpError(400, 'El archivo aún no se ha subido a la nube');

      return this.prisma.document.update({
        where: { id: documentId, entityType, entityId },
        data: { status: 'SUCCESS' },
        select: { id: true, status: true, fileName: true },
      });
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async getPreSignedDownloadUrl(entityType: string, entityId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityType, entityId, status: 'SUCCESS' },
      });

      if (!document) throw new HttpError(404, 'Documento no encontrado o pendiente de subida');

      const downloadUrl = await this.storage.generateDownloadUrl(document.fileKey);
      return { downloadUrl, fileName: document.fileName, contentType: document.contentType };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }
  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
    isTrash: boolean = false,
    page: number,
    limit: number,
    params: {
      fileName?: string;
      contentTypes?: string[];
      sizeMin?: number;
      sizeMax?: number;
      createdFrom?: Date;
      createdTo?: Date;
      deletedFrom?: Date;
      deletedTo?: Date;
      createdBy?: string[];
      deletedBy?: string[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const {
      fileName,
      contentTypes,
      sizeMin,
      sizeMax,
      createdFrom,
      createdTo,
      deletedFrom,
      deletedTo,
      createdBy,
      deletedBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      entityId,
      entityType,
      status: isTrash ? 'TRASHED' : 'SUCCESS',
    };

    if (fileName) {
      whereClause.fileName = { contains: fileName, mode: 'insensitive' };
    }

    if (contentTypes && contentTypes.length > 0) {
      whereClause.AND = [
        {
          OR: contentTypes.map((type) => ({
            contentType: {
              startsWith: type,
            },
          })),
        },
      ];
    }

    if (sizeMin !== undefined || sizeMax !== undefined) {
      whereClause.size = {
        ...(sizeMin !== undefined && { gte: sizeMin }),
        ...(sizeMax !== undefined && { lte: sizeMax }),
      };
    }
    if (createdFrom || createdTo) {
      whereClause.createdAt = {
        ...(createdFrom && { gte: createdFrom }),
        ...(createdTo && {
          lte: new Date(createdTo.setHours(23, 59, 59, 999)),
        }),
      };
    }

    if (deletedFrom || deletedTo) {
      whereClause.deletedAt = {
        ...(deletedFrom && { gte: deletedFrom }),
        ...(deletedTo && { lte: new Date(deletedTo.setHours(23, 59, 59, 999)) }),
      };
    }

    if (createdBy?.length) {
      whereClause.createdBy = { in: createdBy };
    }

    if (deletedBy?.length) {
      whereClause.deletedBy = { in: deletedBy };
    }

    try {
      const [total, documents] = await Promise.all([
        this.prisma.document.count({ where: whereClause }),
        this.prisma.document.findMany({
          where: whereClause,
          select: {
            id: true,
            fileName: true,
            contentType: true,
            size: true,
            status: true,
            createdAt: true,
            createdBy: true,
            deletedAt: true,
            deletedBy: true,
          },
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: skip,
        }),
      ]);

      return {
        documents,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          sortBy,
          sortOrder,
        },
      };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async deleteSoftDocument(entityType: string, entityId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityType, entityId, status: 'SUCCESS' },
      });

      if (!document) throw new HttpError(404, 'Documento no encontrado');

      return this.prisma.document.update({
        where: { id: documentId, entityType, entityId },
        data: { status: 'TRASHED' },
        select: { id: true, status: true, fileName: true },
      });
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async deleteDocument(entityType: string, entityId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityType, entityId, status: 'TRASHED' },
      });

      if (!document)
        throw new HttpError(404, 'Documento no encontrado o no disponible para borrar');

      await this.storage.deleteFile(document.fileKey);

      const deletedDocument = await this.prisma.document.delete({
        where: { id: documentId, entityType, entityId },
        select: { id: true },
      });

      return {
        id: deletedDocument.id,
        message: 'Documento eliminado permanentemente',
      };
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }

  async restoreDocument(entityType: string, entityId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: { id: documentId, entityType, entityId, status: 'TRASHED' },
      });

      if (!document)
        throw new HttpError(404, 'Documento no encontrado o no disponible para borrar');

      return this.prisma.document.update({
        where: { id: documentId, entityType, entityId },
        data: { status: 'SUCCESS' },
        select: { id: true, status: true, fileName: true },
      });
    } catch (error) {
      throw HttpError.handleError(error);
    }
  }
}
