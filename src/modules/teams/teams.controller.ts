import { BaseController } from '@/controllers/base.controller.js';

import { Company } from './teams.schema.js';
import { CompaniesService } from './teams.service.js';

export class CompaniesController extends BaseController<Company> {
  constructor(private readonly companiesService: CompaniesService) {
    super(companiesService);
  }
}
