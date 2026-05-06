import { BaseAuditService } from '@/services/base-audit.service.js';
import { HttpError } from '@/utils/http.error.js';

import type { IStorageProvider } from './interfaces/storage.provider.interface.js';
import { GLOBAL_UPLOAD_RULES } from './storage.constants.js';
import { StorageRepository } from './storage.repository.js';
import { RequestUploadParams } from './storage.schema.js';

export class StorageService extends BaseAuditService<any> {
  constructor(
    private readonly storageRepo: StorageRepository,
    private readonly storage: IStorageProvider,
  ) {
    super(storageRepo);
  }

  /**
   * Define el filtro base para registros activos vs papelera
   */
  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'SUCCESS',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  // ==========================================
  // 1. CONSULTAS Y LECTURA
  // ==========================================

  async getDocument(entityType: string, entityId: string, documentId: string) {
    const doc = await this.storageRepo.findFirst({
      where: { id: documentId, entityType, entityId },
    });

    if (!doc) throw new HttpError(404, 'Documento no encontrado');
    return doc;
  }

  async getDocumentsByEntity(
    entityType: string,
    entityId: string,
    isTrash: boolean,
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

    const whereClause: any = this.getAuditWhere(isTrash, {
      entityId,
      entityType,
    });

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
        ...(createdFrom && { gte: new Date(createdFrom) }),
        ...(createdTo && { lte: new Date(new Date(createdTo).setHours(23, 59, 59, 999)) }),
      };
    }

    if (isTrash && (deletedFrom || deletedTo)) {
      whereClause.deletedAt = {
        ...(deletedFrom && { gte: new Date(deletedFrom) }),
        ...(deletedTo && { lte: new Date(new Date(deletedTo).setHours(23, 59, 59, 999)) }),
      };
    }

    if (createdBy?.length) whereClause.createdBy = { in: createdBy };
    if (deletedBy?.length) whereClause.deletedBy = { in: deletedBy };

    const [total, documents] = await Promise.all([
      this.storageRepo.count(whereClause),
      this.storageRepo.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortBy]: sortOrder },
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
  }

  async getPreSignedDownloadUrl(entityType: string, entityId: string, documentId: string) {
    const document = await this.getDocument(entityType, entityId, documentId);

    if (document.status !== 'SUCCESS') {
      throw new HttpError(400, 'El documento no está disponible para descarga');
    }

    const downloadUrl = await this.storage.generateDownloadUrl(document.fileKey);
    return { downloadUrl, fileName: document.fileName, contentType: document.contentType };
  }

  // ==========================================
  // 2. CICLO DE VIDA DE SUBIDA
  // ==========================================

  async requestUploadUrl(
    fileData: RequestUploadParams,
    entityId: string,
    entityType: string,
    userId?: string,
  ) {
    if (fileData.size > GLOBAL_UPLOAD_RULES.MAX_FILE_SIZE) {
      throw new HttpError(400, 'El archivo excede el tamaño máximo permitido');
    }
    if (!GLOBAL_UPLOAD_RULES.ALLOWED_MIME_TYPES.includes(fileData.mimeType)) {
      throw new HttpError(400, 'Tipo de archivo no soportado');
    }

    const ext = fileData.fileName.split('.').pop();
    const fileKey = `${entityType.toLowerCase()}/${entityId}/${crypto.randomUUID()}.${ext}`;

    const document = await this.create(
      {
        fileName: fileData.fileName,
        fileKey,
        contentType: fileData.mimeType,
        size: fileData.size,
        status: 'PENDING',
        entityType,
        entityId,
        isPublic: fileData.isPublic,
      },
      userId,
    );

    const uploadUrl = await this.storage.generateUploadUrl(fileKey, fileData.mimeType);
    return { uploadUrl, documentId: document.id, fileKey };
  }

  async confirmUpload(entityType: string, entityId: string, documentId: string, userId?: string) {
    const where = { id: documentId, entityType, entityId };
    const document = await this.getDocument(entityType, entityId, documentId);

    if (document.status === 'SUCCESS') return document;

    const exists = await this.storage.checkFileExists(document.fileKey);
    if (!exists) throw new HttpError(400, 'El archivo aún no se ha subido al almacenamiento');

    return this.updateWithContext(where, { status: 'SUCCESS' }, userId);
  }

  // ==========================================
  // 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
  // ==========================================

  async updateDocumentMetadata(
    entityType: string,
    entityId: string,
    documentId: string,
    data: { fileName?: string; isPublic?: boolean },
    userId: string,
  ) {
    return this.updateWithContext({ id: documentId, entityType, entityId }, data, userId);
  }

  async deleteSoftDocument(
    entityType: string,
    entityId: string,
    documentId: string,
    userId: string,
  ) {
    return this.softDeleteWithContext(
      { id: documentId, entityType, entityId, status: 'SUCCESS' },
      userId,
    );
  }

  async restoreDocument(entityType: string, entityId: string, documentId: string, userId: string) {
    return this.restoreWithContext(
      { id: documentId, entityType, entityId, status: 'TRASHED' },
      userId,
    );
  }

  // ==========================================
  // 4. ACCIONES MASIVAS (BULK)
  // ==========================================

  async bulkDeleteSoft(
    entityType: string,
    entityId: string,
    documentIds: string[],
    userId: string,
  ) {
    return this.softDeleteManyWithContext(
      { id: { in: documentIds }, entityType, entityId, status: 'SUCCESS' },
      userId,
    );
  }

  async bulkRestore(entityType: string, entityId: string, documentIds: string[], userId: string) {
    return this.restoreManyWithContext(
      { id: { in: documentIds }, entityType, entityId, status: 'TRASHED' },
      userId,
    );
  }

  // ==========================================
  // 5. MANTENIMIENTO Y ELIMINACIÓN FÍSICA
  // ==========================================

  async deleteDocumentPermanent(entityType: string, entityId: string, documentId: string) {
    const document = await this.storageRepo.findFirst({
      where: { id: documentId, entityType, entityId, status: 'TRASHED' },
    });

    if (!document) throw new HttpError(404, 'Documento no encontrado en la papelera');

    await this.storage.deleteFile(document.fileKey);
    return this.hardDeleteManyWithContext({ id: documentId });
  }

  async emptyTrash(entityType: string, entityId: string) {
    const where = { entityType, entityId, status: 'TRASHED' };
    const docs = await this.storageRepo.findMany({ where });

    if (docs.length === 0) return { count: 0 };

    const keys = docs.map((d) => d.fileKey);
    await this.storage.deleteFiles(keys);

    return this.hardDeleteManyWithContext(where);
  }

  async cleanupPendingUploads(hoursOld: number = 24) {
    const threshold = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const where = { status: 'PENDING', createdAt: { lt: threshold } };

    return this.hardDeleteManyWithContext(where);
  }
}
