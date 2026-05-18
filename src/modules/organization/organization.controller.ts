import { BaseController } from '@/controllers/base.controller.js';

import { Organization } from './organization.schema.js';
import { OrganizationService } from './organization.service.js';

export class OrganizationController extends BaseController<Organization> {
  constructor(private readonly organizationService: OrganizationService) {
    super(organizationService);
  }
}
