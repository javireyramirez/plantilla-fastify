import { BaseRbacService } from '@/services/base-owned.service.js';

import { CompaniesRepository } from './companies.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesService extends BaseRbacService<Company> {
  constructor(private readonly companiesRepo: CompaniesRepository) {
    super(companiesRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
