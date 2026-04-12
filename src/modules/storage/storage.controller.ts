import type { FastifyInstance } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  ConfirmParams,
  EntityParams,
  GetDocumentsQuery,
  RequestUploadParams,
} from './storage.schema.js';

type StorageService = FastifyInstance['storageService'];

export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  async requestUploadUrl(
    request: FastifyRequest<{ Body: { fileData: RequestUploadParams }; Params: EntityParams }>,
    reply: FastifyReply,
  ) {
    const { fileData } = request.body;
    const { entityType, entityId } = request.params;

    const result = await this.storageService.requestUploadUrl(fileData, entityId, entityType);
    return reply.code(201).send(result);
  }

  async confirmUpload(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;

    const result = await this.storageService.confirmUpload(entityType, entityId, documentId);
    return reply.code(200).send(result);
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
    return reply.code(200).send(result);
  }

  async getDocumentsByEntity(
    request: FastifyRequest<{ Params: EntityParams; Querystring: GetDocumentsQuery }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId } = request.params;
    const { isTrash } = request.query;

    const result = await this.storageService.getDocumentsByEntity(entityType, entityId, isTrash);
    return reply.code(200).send(result);
  }

  async deleteSoftDocument(
    request: FastifyRequest<{ Params: ConfirmParams }>,
    reply: FastifyReply,
  ) {
    const { entityType, entityId, documentId } = request.params;

    const result = await this.storageService.deleteSoftDocument(entityType, entityId, documentId);
    return reply.code(200).send(result);
  }

  async deleteDocument(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;

    const result = await this.storageService.deleteDocument(entityType, entityId, documentId);
    return reply.code(200).send(result);
  }

  async restoreDocument(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityType, entityId, documentId } = request.params;

    const result = await this.storageService.restoreDocument(entityType, entityId, documentId);
    return reply.code(200).send(result);
  }
}
