import { Role } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class RoleRepository extends BaseRepository<Role> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'role');
  }
}
