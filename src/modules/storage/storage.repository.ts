import { Document } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class StorageRepository extends BaseRepository<Document> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'document');
  }
}
