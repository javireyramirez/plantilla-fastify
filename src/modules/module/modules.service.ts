import { Module } from '@prisma/client';

import { BaseAuditService } from '@/services/base-owned.service.js';

import { ModuleRepository } from './module.repository.js';

export class ModuleService extends BaseAuditService<Module> {
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
