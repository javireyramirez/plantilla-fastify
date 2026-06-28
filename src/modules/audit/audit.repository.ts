import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';
import { AuditLogType } from './audit.schema.js';

export class AuditLogRepository extends BaseRepository<AuditLogType> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'auditLog');
  }
}
