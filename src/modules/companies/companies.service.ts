import { BaseRbacService } from '@/services/base-owned.service.js';

import { CompaniesRepository } from './companies.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesService extends BaseRbacService<Company> {
  constructor(private readonly companiesRepo: CompaniesRepository) {
    super(companiesRepo);
  }

  protected override getDefaultInclude() {
    return {
      owner: { select: { name: true, email: true } },
      ownerTeam: { select: { id: true, name: true } },
      ownerOrganization: { select: { id: true, name: true, slug: true } },
    };
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
