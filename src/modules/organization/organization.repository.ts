import { Organization } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'organization');
  }
}
