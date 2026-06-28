import { Zip, ZipPassThrough } from 'fflate';
import { PassThrough, Readable } from 'stream';

import { BaseRbacService } from '@/services/base-owned.service.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import type { IStorageProvider } from './interfaces/storage.provider.interface.js';
import { GLOBAL_UPLOAD_RULES } from './storage.constants.js';
import { StorageRepository } from './storage.repository.js';
import { RequestUploadParams } from './storage.schema.js';

export class StorageService extends BaseRbacService<any> {
  protected override readonly moduleSlug = 'documents';

  constructor(
    private readonly storageRepo: StorageRepository,
    private readonly storage: IStorageProvider,
  ) {
    super(storageRepo);
  }

  protected override getDefaultInclude(): object {
    return {};
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildStringFilter('fileName', filters.fileName),
      ...this.buildMultiSelectFilter('contentType', filters.contentTypes),
      ...this.buildMultiSelectFilter('createdBy', filters.createdBy),
      ...this.buildMultiSelectFilter('deletedBy', filters.deletedBy),
      ...this.buildDateRangeFilter('createdAt', filters.createdFrom, filters.createdTo),
      ...this.buildDateRangeFilter('deletedAt', filters.deletedFrom, filters.deletedTo),
      ...(filters.sizeMin !== undefined || filters.sizeMax !== undefined
        ? {
            size: {
              ...(filters.sizeMin !== undefined && { gte: filters.sizeMin }),
              ...(filters.sizeMax !== undefined && { lte: filters.sizeMax }),
            },
          }
        : {}),
    };
  }

  // Define el filtro base para registros activos vs papelera

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
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
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    params: Record<string, any> = {},
  ) {
    const filters = this.buildWhereFilters(params);
    const where = {
      entityType,
      entityId,
      ...this.getStatusFilter(isTrash),
      ...filters,
    };

    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    return this.findManyWithCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    });
  }

  async getPreSignedDownloadUrl(
    entityType: string,
    entityId: string,
    documentId: string,
    operation: 'view' | 'download' = 'view',
  ) {
    const doc = await this.getDocument(entityType, entityId, documentId);
    if (doc.status !== 'ACTIVE') {
      throw new HttpError(400, 'El documento no está activo');
    }

    const url = await this.storage.generateDownloadUrl(doc.fileKey, doc.fileName, operation);
    return { url, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }; // 15 min
  }

  // ==========================================
  // 2. CICLO DE SUBIDA
  // ==========================================

  async requestUploadUrl(
    fileData: RequestUploadParams,
    entityId: string,
    entityType: string,
    options: WriteOptions = {},
  ) {
    if (fileData.size > GLOBAL_UPLOAD_RULES.MAX_FILE_SIZE) {
      throw new HttpError(400, 'El archivo excede el tamaño máximo permitido');
    }
    if (!GLOBAL_UPLOAD_RULES.ALLOWED_MIME_TYPES.includes(fileData.mimeType)) {
      throw new HttpError(400, 'Tipo de archivo no soportado');
    }

    const ext = fileData.fileName.split('.').pop();
    const fileKey = `${entityType.toLowerCase()}/${entityId}/${crypto.randomUUID()}.${ext}`;

    const document = await this.storageRepo.create({
      data: {
        fileName: fileData.fileName,
        fileKey,
        contentType: fileData.mimeType,
        size: fileData.size,
        status: 'PENDING',
        entityType,
        entityId,
        isPublic: fileData.isPublic,
        createdBy: options.userId,
      },
    });

    try {
      const moduleId = await this.getModuleId();
      await this.repository.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: 'CREATE',
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: document.id,
          displayName: document.fileName,
          description: options.description || `Solicitud de subida de archivo: ${document.fileName} (${(document.size / 1024).toFixed(2)} KB)`,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        },
      });
    } catch (error) {
      console.error('Error al guardar log de auditoría (requestUploadUrl):', error);
    }

    const uploadUrl = await this.storage.generateUploadUrl(fileKey, fileData.mimeType);
    return { uploadUrl, documentId: document.id, fileKey };
  }

  async confirmUpload(
    entityType: string,
    entityId: string,
    documentId: string,
    options: WriteOptions = {},
  ) {
    const where = { id: documentId, entityType, entityId };
    const document = await this.getDocument(entityType, entityId, documentId);

    if (document.status === 'ACTIVE') return document;

    const exists = await this.storage.checkFileExists(document.fileKey);
    if (!exists) throw new HttpError(400, 'El archivo aún no se ha subido al almacenamiento');

    return this.updateWithContext(where, { status: 'ACTIVE' }, {
      ...options,
      description: `Confirmación de subida de archivo: ${document.fileName}`,
    });
  }

  // ==========================================
  // 3. EDICIÓN Y ESTADOS (INDIVIDUAL)
  // ==========================================

  async updateDocumentMetadata(
    entityType: string,
    entityId: string,
    documentId: string,
    data: { fileName?: string; isPublic?: boolean },
    options: WriteOptions = {},
  ) {
    return this.updateWithContext({ id: documentId, entityType, entityId }, data, {
      ...options,
      description: `Actualización de metadatos del archivo`,
    });
  }

  async deleteSoftDocument(
    entityType: string,
    entityId: string,
    documentId: string,
    options: WriteOptions = {},
  ) {
    const document = await this.getDocument(entityType, entityId, documentId);
    return this.softDeleteWithContext(
      { id: documentId, entityType, entityId, status: 'ACTIVE' },
      options.userId!,
      {
        ...options,
        description: `Archivo movido a la papelera: ${document.fileName}`,
      },
    );
  }

  async restoreDocument(
    entityType: string,
    entityId: string,
    documentId: string,
    options: WriteOptions = {},
  ) {
    const document = await this.getDocument(entityType, entityId, documentId);
    return this.restoreWithContext(
      { id: documentId, entityType, entityId, status: 'TRASHED' },
      options.userId,
      {
        ...options,
        description: `Archivo restaurado de la papelera: ${document.fileName}`,
      },
    );
  }

  // ==========================================
  // 4. ACCIONES MASIVAS (BULK)
  // ==========================================

  async bulkDeleteSoft(
    entityType: string,
    entityId: string,
    documentIds: string[],
    options: WriteOptions = {},
  ) {
    return this.softDeleteManyWithContext(
      { id: { in: documentIds }, entityType, entityId, status: 'ACTIVE' },
      options.userId,
      {
        ...options,
        description: `Eliminación lógica masiva de ${documentIds.length} archivos`,
      },
    );
  }

  async bulkRestore(
    entityType: string,
    entityId: string,
    documentIds: string[],
    options: WriteOptions = {},
  ) {
    return this.restoreManyWithContext(
      { id: { in: documentIds }, entityType, entityId, status: 'TRASHED' },
      options.userId,
      {
        ...options,
        description: `Restauración masiva de ${documentIds.length} archivos de la papelera`,
      },
    );
  }

  async getBulkPreSignedDownloadUrls(entityType: string, entityId: string, documentIds: string[]) {
    return Promise.all(
      documentIds.map((id) => this.getPreSignedDownloadUrl(entityType, entityId, id, 'download')),
    );
  }

  async getBulkDownloadAsZip(
    entityType: string,
    entityId: string,
    documentIds: string[],
  ): Promise<Readable> {
    const output = new PassThrough();

    // fflate necesita un callback para escupir los datos comprimidos
    const zip = new Zip((err, data, final) => {
      if (err) {
        output.destroy(err);
        return;
      }
      output.write(data);
      // IMPORTANTE: Solo cerramos el stream de salida cuando fflate diga que terminó
      if (final) {
        output.end();
      }
    });

    (async () => {
      try {
        for (const id of documentIds) {
          const doc = await this.getDocument(entityType, entityId, id);
          const fileStream = await this.storage.getFileStream(doc.fileKey);

          const zipFile = new ZipPassThrough(doc.fileName);
          zip.add(zipFile);

          // Consumir el stream del archivo
          for await (const chunk of fileStream) {
            zipFile.push(chunk);
          }

          // Finalizar el archivo actual dentro del zip
          zipFile.push(new Uint8Array(0), true);
        }

        // Finalizar el zip global
        zip.end();
      } catch (error) {
        console.error('Error en el proceso de ZIP:', error);
        output.destroy(error as Error);
      }
    })();

    return output;
  }

  // ==========================================
  // 5. MANTENIMIENTO Y ELIMINACIÓN FÍSICA
  // ==========================================

  async deleteDocumentPermanent(
    entityType: string,
    entityId: string,
    documentId: string,
    options: WriteOptions = {},
  ) {
    const document = await this.storageRepo.findFirst({
      where: { id: documentId, entityType, entityId, status: 'TRASHED' },
    });

    if (!document) throw new HttpError(404, 'Documento no encontrado en la papelera');

    await this.storage.deleteFile(document.fileKey);
    return this.hardDeleteManyWithContext({ id: documentId }, {
      ...options,
      description: `Eliminación permanente física del archivo: ${document.fileName}`,
    });
  }

  async emptyTrash(entityType: string, entityId: string, options: WriteOptions = {}) {
    const where = { entityType, entityId, status: 'TRASHED' };
    const docs = await this.storageRepo.findMany({ where });

    if (docs.length === 0) return { count: 0 };

    const keys = docs.map((d) => d.fileKey);
    await this.storage.deleteFiles(keys);

    return this.hardDeleteManyWithContext(where, {
      ...options,
      description: `Vaciado de papelera: eliminación física de ${docs.length} archivos`,
    });
  }

  async cleanupPendingUploads(hoursOld: number = 24) {
    const threshold = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const where = { status: 'PENDING', createdAt: { lt: threshold } };

    return this.hardDeleteManyWithContext(where);
  }

  override async hardDelete(id: string, options: WriteOptions = {}): Promise<any> {
    const doc = await this.storageRepo.findFirst({
      where: { id },
      scope: options.scope,
    });
    if (!doc) throw new HttpError(404, 'Documento no encontrado');

    await this.storage.deleteFile(doc.fileKey);
    return super.hardDelete(id, options);
  }

  override async hardDeleteMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };

    const docs = await this.storageRepo.findMany({
      where: { id: { in: ids } },
      scope: options.scope,
    });

    if (docs.length === 0) return { count: 0 };

    const keys = docs.map((d) => d.fileKey);
    await this.storage.deleteFiles(keys);

    return super.hardDeleteMany(ids, options);
  }
}
