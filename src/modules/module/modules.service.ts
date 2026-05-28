import { Module } from '@prisma/client';

import { BaseRbacService } from '@/services/base-owned.service.js';

import { ModuleRepository } from './module.repository.js';

export class ModuleService extends BaseRbacService<Module> {
  constructor(private readonly modulesRepo: ModuleRepository) {
    super(modulesRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
