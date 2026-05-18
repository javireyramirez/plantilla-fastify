import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

import { Organization } from './organization.schema.js';

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'organization');
  }
}
