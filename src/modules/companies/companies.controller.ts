import { BaseController } from '@/controllers/base.controller.js';
import { Company } from '@/modules/companies/companies.schema.js';
import { CompaniesService } from '@/modules/companies/companies.service.js';

export class CompaniesController extends BaseController<Company> {
  constructor(private readonly companiesService: CompaniesService) {
    super(companiesService);
  }
}
