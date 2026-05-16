import { BaseAuditService } from '@/services/base-audit.service.js';

import { CompaniesRepository } from './companies.repository.js';
import { Company } from './companies.schema.js';

export class CompaniesService extends BaseAuditService<Company> {
  constructor(private readonly companiesRepo: CompaniesRepository) {
    super(companiesRepo);
  }

  async findFirst(params: any = {}) {
    const defaultInclude = {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    };

    return super.findFirst({
      ...params,
      include: {
        ...defaultInclude,
        ...(params.include || {}),
      },
    });
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

  async create(data: any, userId?: string) {
    const defaultInclude = {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    };

    return super.create(data, userId, {
      include: {
        ...defaultInclude,
      },
    });
  }

  async update(id: string, data: any, userId?: string) {
    const defaultInclude = {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    };

    return super.update(id, data, userId, {
      include: {
        ...defaultInclude,
      },
    });
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
