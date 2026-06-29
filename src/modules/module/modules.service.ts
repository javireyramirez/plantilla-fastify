import { Module } from '@prisma/client';

import { BaseAuditService } from '@/services/base-audit.service.js';
import { BaseRbacService } from '@/services/base-owned.service.js';

import { ModuleRepository } from './module.repository.js';

export class ModuleService extends BaseAuditService<Module> {
  protected override readonly moduleSlug = 'modules';

  constructor(private readonly modulesRepo: ModuleRepository) {
    super(modulesRepo);
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildStringFilter('name', filters.name),
      ...this.buildStringFilter('slug', filters.slug),
      ...this.buildStringFilter('category', filters.category),

      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),
    };
  }

  public override async findList(params: {
    where?: any;
    take?: number;
    orderBy?: any;
    select?: any;
    scope?: any;
  }): Promise<Module[]> {
    let orderBy = params.orderBy;
    if (orderBy && 'name' in orderBy) {
      orderBy = { slug: orderBy.name };
    }
    return this.repository.findMany({
      where: params.where,
      take: params.take ?? 20,
      orderBy: orderBy ?? { slug: 'asc' },
      select: {
        id: true,
        slug: true,
        category: true,
        ...(params.select ?? {}),
      },
      scope: params.scope,
    }) as unknown as Module[];
  }

  // Define el filtro base para registros activos vs papelera

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
