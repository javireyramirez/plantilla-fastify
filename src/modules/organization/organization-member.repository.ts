import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

import { OrganizationMember } from './organization.schema.js';

export class OrganizationMemberRepository extends BaseRepository<OrganizationMember> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'organizationMember');
  }
}
