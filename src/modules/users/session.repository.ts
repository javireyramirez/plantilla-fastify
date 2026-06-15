import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

import { Session } from './users.schema.js';

export class SessionRepository extends BaseRepository<Session> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'session');
  }
}
