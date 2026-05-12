import { BaseAuditService } from '@/services/base-audit.service.js';

import { CompaniesRepository } from './companies.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesService extends BaseAuditService<Company> {
  constructor(private readonly companiesRepo: CompaniesRepository) {
    super(companiesRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
    };
  }
}
