import { BaseAuditService } from '@/services/base-audit.service.js';

import { OrganizationRepository } from './organization.repository.js';
import { Organization } from './organization.schema.js';

export class OrganizationService extends BaseAuditService<Organization> {
  constructor(private readonly organizationRepo: OrganizationRepository) {
    super(organizationRepo);
  }

  protected getStatusFilter(isTrash: boolean) {
    return {
      status: isTrash ? 'TRASHED' : 'ACTIVE',
      deletedAt: isTrash ? { not: null } : null,
    };
  }
}
