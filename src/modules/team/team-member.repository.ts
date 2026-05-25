import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

import { TeamMember } from './team.schema.js';

export class TeamMemberRepository extends BaseRepository<TeamMember> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'teamMember');
  }
}
