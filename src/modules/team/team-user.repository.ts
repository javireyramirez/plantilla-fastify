import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

import { TeamUser } from './team.schema.js';

export class TeamUserRepository extends BaseRepository<TeamUser> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'teamUser');
  }
}
