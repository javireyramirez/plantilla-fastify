import { BaseController } from '@/controllers/base.controller.js';

import { Company } from './organizations.schema.js';
import { CompaniesService } from './organizations.service.js';

export class CompaniesController extends BaseController<Company> {
  constructor(private readonly companiesService: CompaniesService) {
    super(companiesService);
  }
}
