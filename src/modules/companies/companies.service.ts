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

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
      ...(filters.nif && { nif: { contains: filters.nif, mode: 'insensitive' } }),
      ...(Array.isArray(filters.sector) &&
        filters.sector.length > 0 && {
          sector: { in: filters.sector },
        }),
      ...(typeof filters.sector === 'string' && {
        sector: filters.sector,
      }),
      ...((filters.createdAtFrom || filters.createdAtTo) && {
        createdAt: {
          ...(filters.createdAtFrom && { gte: new Date(filters.createdAtFrom) }),
          ...(filters.createdAtTo && { lte: new Date(filters.createdAtTo) }),
        },
      }),
    };
  }
}
