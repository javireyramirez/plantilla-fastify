import { OwnedController } from '@/controllers/base-owned.controller.js';
import { Company } from '@/modules/companies/companies.schema.js';
import { CompaniesService } from '@/modules/companies/companies.service.js';

export class CompaniesController extends OwnedController<Company> {
  constructor(private readonly companiesService: CompaniesService) {
    super(companiesService);
  }
}
