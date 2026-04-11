import type { FastifyInstance } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  ConfirmParams,
  EntityIdParams,
  EntityParams,
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
    const { entityId, entityType } = request.params;

    const result = await this.storageService.requestUploadUrl(fileData, entityId, entityType);
    return reply.code(201).send(result);
  }

  async confirmUpload(request: FastifyRequest<{ Params: ConfirmParams }>, reply: FastifyReply) {
    const { entityId, documentId } = request.params;

    const result = await this.storageService.confirmUpload(entityId, documentId);
    return reply.code(200).send(result);
  }

  async getPreSignedDownloadUrl(
    request: FastifyRequest<{ Params: ConfirmParams }>,
    reply: FastifyReply,
  ) {
    const { entityId, documentId } = request.params;

    const result = await this.storageService.getPreSignedDownloadUrl(entityId, documentId);
    return reply.code(200).send(result);
  }

  async getDocumentsByEntity(
    request: FastifyRequest<{ Params: EntityIdParams }>,
    reply: FastifyReply,
  ) {
    const { entityId } = request.params;

    const result = await this.storageService.getDocumentsByEntity(entityId);
    return reply.code(200).send(result);
  }
}
