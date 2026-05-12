import { FastifyInstance } from 'fastify';
import { BaseRepository } from '@/repositories/base.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesRepository extends BaseRepository<Company> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'company');
  }
}
