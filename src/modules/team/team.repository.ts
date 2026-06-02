import { Team } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class TeamRepository extends BaseRepository<Team> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'team');
  }
}
