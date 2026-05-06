import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class StorageRepository extends BaseRepository<any> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'document');
  }
}
