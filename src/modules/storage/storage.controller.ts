import type { FastifyInstance } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

import { WriteOptions } from '@/types/base.types.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkAction,
  ConfirmParams,
  EntityParams,
  GetDocumentsQuery,
  RequestUploadParams,
  UpdateMetadata,
} from './storage.schema.js';

type StorageService = FastifyInstance['storageService'];

export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  private getWriteOptions(request: FastifyRequest): WriteOptions {
    return {
      userId: request.session?.user?.id || (request as any).session?.userId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getDocumentsByEntity(
    request: FastifyRequest<{ Params: EntityParams; Querystring: GetDocumentsQuery }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId } = request.params;
    const { page, limit, isTrash, sortBy, sortOrder, ...filters } = request.query;

    const { meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.storageService.getDocumentsByEntity(
      entityType,
      entityId,
      isTrash,
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    );

    const baseMeta = meta(result.total);
    const hasNextPage = baseMeta.page < baseMeta.totalPages;

    return reply.send({
      documents: result.data,
      meta: {
        ...baseMeta,
        hasNextPage,
        sortBy,
        sortOrder,
      },
    });
  }

  async getDocument(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.getDocument(entityType, entityId, documentId);
    return reply.send(result);
  }

  async getPreSignedDownloadUrl(
    request: FastifyRequest<{ Params: ConfirmParams }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.getPreSignedDownloadUrl(
      entityType,
      entityId,
      documentId,
    );
    return reply.send(result);
  }

  // ==========================================
  // 2. CICLO DE SUBIDA
  // ==========================================

  async requestUploadUrl(
    request: FastifyRequest<{ Body: { fileData: RequestUploadParams }; Params: EntityParams }>,
    reply: FastifyReply,
  ) {
    const { fileData } = request.body;
    const { entityType, entityId } = request.params;

    const result = await this.storageService.requestUploadUrl(
      fileData,
      entityId,
      entityType,
      this.getWriteOptions(request),
    );
    return reply.code(201).send(result);
  }

  async confirmUpload(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.confirmUpload(
      entityType,
      entityId,
      documentId,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  // ==========================================
  // 3. ACTUALIZACIÓN Y ESTADOS
  // ==========================================

  async updateMetadata(
    request: FastifyRequest<{
      Params: ConfirmParams;
      Body: UpdateMetadata;
    }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.updateDocumentMetadata(
      entityType,
      entityId,
      documentId,
      request.body,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  async deleteSoft(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.deleteSoftDocument(
      entityType,
      entityId,
      documentId,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  async restore(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.restoreDocument(
      entityType,
      entityId,
      documentId,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  // ==========================================
  // 4. ACCIONES MASIVAS
  // ==========================================

  async bulkDeleteSoft(
    request: FastifyRequest<{ Params: EntityParams; Body: BulkAction }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId } = request.params;
    const { documentIds } = request.body;
    const result = await this.storageService.bulkDeleteSoft(
      entityType,
      entityId,
      documentIds,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  async bulkRestore(
    request: FastifyRequest<{ Params: EntityParams; Body: BulkAction }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId } = request.params;
    const { documentIds } = request.body;
    const result = await this.storageService.bulkRestore(
      entityType,
      entityId,
      documentIds,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  async bulkDownload(
    request: FastifyRequest<{ Params: EntityParams; Body: BulkAction }>,
    reply: FastifyReply,
  ) {
    const { documentIds } = request.body;
    const { entityType, entityId } = request.params;
    const urls = await this.storageService.getBulkPreSignedDownloadUrls(
      entityType,
      entityId,
      documentIds,
    );
    return reply.send(urls);
  }

  async bulkDownloadZip(
    request: FastifyRequest<{ Params: EntityParams; Body: BulkAction }>,
    reply: FastifyReply,
  ) {
    const { documentIds } = request.body;
    const { entityType, entityId } = request.params;

    const stream = await this.storageService.getBulkDownloadAsZip(
      entityType,
      entityId,
      documentIds,
    );

    return reply
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', 'attachment; filename="documentos.zip"')
      .send(stream);
  }

  // ==========================================
  // 5. ELIMINACIÓN PERMANENTE
  // ==========================================

  async emptyTrash(request: FastifyRequest<{ Params: EntityParams }>, reply: FastifyReply) {
    const { entityType, entityId } = request.params;
    const result = await this.storageService.emptyTrash(
      entityType,
      entityId,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }

  async deletePermanent(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.deleteDocumentPermanent(
      entityType,
      entityId,
      documentId,
      this.getWriteOptions(request),
    );
    return reply.send(result);
  }
}
