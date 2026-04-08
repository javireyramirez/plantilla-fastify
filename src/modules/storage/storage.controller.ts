import type { FastifyInstance } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

import { EntityParams, RequestUploadParams } from './storage.schema.js';

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
}
