import { BaseAuditService } from '@/services/base-audit.service.js';

import { CompaniesRepository } from './companies.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesService extends BaseAuditService<Company> {
  constructor(private readonly companiesRepo: CompaniesRepository) {
    super(companiesRepo);
  }

  async findManyWithCount(params: any) {
    const defaultInclude = {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    };

    return super.findManyWithCount({
      ...params,
      include: {
        ...defaultInclude,
        ...params.include,
      },
    });
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
    };
  }
}
