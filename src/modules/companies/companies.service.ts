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
    const where: any = {};

    if (filters.createdAtFrom) {
      const from = new Date(filters.createdAtFrom);
      from.setHours(0, 0, 0, 0);
      where.createdAt = { ...(where.createdAt || {}), gte: from };
    }

    if (filters.createdAtTo) {
      const to = new Date(filters.createdAtTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt || {}), lte: to };
    }

    return {
      ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
      ...(filters.nif && { nif: { contains: filters.nif, mode: 'insensitive' } }),
      ...(Array.isArray(filters.sector) &&
        filters.sector.length > 0 && {
          sector: { in: filters.sector },
        }),
      ...(typeof filters.sector === 'string' && { sector: filters.sector }),
      ...where,
    };
  }
}
