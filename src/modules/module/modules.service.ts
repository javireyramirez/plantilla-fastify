import { Module } from '@prisma/client';

import { BaseAuditService } from '@/services/base-audit.service.js';
import { BaseRbacService } from '@/services/base-owned.service.js';

import { ModuleRepository } from './module.repository.js';

export class ModuleService extends BaseAuditService<Module> {
  constructor(private readonly modulesRepo: ModuleRepository) {
    super(modulesRepo);
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildStringFilter('name', filters.name),

      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),
    };
  }

  // Define el filtro base para registros activos vs papelera

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
