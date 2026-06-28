import { BaseRbacService } from '@/services/base-owned.service.js';

import { CompaniesRepository } from './companies.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesService extends BaseRbacService<Company> {
  protected override readonly moduleSlug = 'companies';

  constructor(private readonly companiesRepo: CompaniesRepository) {
    super(companiesRepo);
  }

  protected override getDefaultInclude() {
    return {
      owner: { select: { name: true, email: true } },
    };
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildStringFilter('name', filters.name),
      ...this.buildStringFilter('nif', filters.nif),

      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),

      ...this.buildMultiSelectFilter('sector', filters.sector),
    };
  }
}
