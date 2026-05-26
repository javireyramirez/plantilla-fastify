import { Module } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class ModuleRepository extends BaseRepository<Module> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'module');
  }
}
