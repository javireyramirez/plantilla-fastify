import type { FastifyInstance } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

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

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getDocumentsByEntity(
    request: FastifyRequest<{ Params: EntityParams; Querystring: GetDocumentsQuery }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId } = request.params;
    const { page, limit, isTrash, ...filters } = request.query;

    const result = await this.storageService.getDocumentsByEntity(
      entityType,
      entityId,
      isTrash,
      page,
      limit,
      filters,
    );
    return reply.send(result);
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
    const userId = request.session?.user?.id;

    const result = await this.storageService.requestUploadUrl(
      fileData,
      entityId,
      entityType,
      userId,
    );
    return reply.code(201).send(result);
  }

  async confirmUpload(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const userId = request.session?.user?.id;

    const result = await this.storageService.confirmUpload(
      entityType,
      entityId,
      documentId,
      userId,
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
    const userId = request.session.user.id;

    const result = await this.storageService.updateDocumentMetadata(
      entityType,
      entityId,
      documentId,
      request.body,
      userId,
    );
    return reply.send(result);
  }

  async deleteSoft(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const userId = request.session.user.id;

    const result = await this.storageService.deleteSoftDocument(
      entityType,
      entityId,
      documentId,
      userId,
    );
    return reply.send(result);
  }

  async restore(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const userId = request.session.user.id;

    const result = await this.storageService.restoreDocument(
      entityType,
      entityId,
      documentId,
      userId,
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
    const userId = request.session.user.id;

    const result = await this.storageService.bulkDeleteSoft(
      entityType,
      entityId,
      documentIds,
      userId,
    );
    return reply.send(result);
  }

  async bulkRestore(
    request: FastifyRequest<{ Params: EntityParams; Body: BulkAction }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId } = request.params;
    const { documentIds } = request.body;
    const userId = request.session.user.id;

    const result = await this.storageService.bulkRestore(entityType, entityId, documentIds, userId);
    return reply.send(result);
  }

  // ==========================================
  // 5. ELIMINACIÓN PERMANENTE
  // ==========================================

  async emptyTrash(request: FastifyRequest<{ Params: EntityParams }>, reply: FastifyReply) {
    const { entityType, entityId } = request.params;
    const result = await this.storageService.emptyTrash(entityType, entityId);
    return reply.send(result);
  }

  async deletePermanent(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;
    const result = await this.storageService.deleteDocumentPermanent(
      entityType,
      entityId,
      documentId,
    );
    return reply.send(result);
  }
}
