import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

import { Users } from './users.schema.js';

export class UsersRepository extends BaseRepository<Users> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'user');
  }
}
