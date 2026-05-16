import { BaseController } from '@/controllers/base.controller.js';
import { CompaniesService } from './companies.service.js';
import { Company } from './companies.schema.js';

export class CompaniesController extends BaseController<Company> {
  constructor(private readonly companiesService: CompaniesService) {
    super(companiesService);
  }
}
