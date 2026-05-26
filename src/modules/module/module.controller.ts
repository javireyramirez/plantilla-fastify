import { Module } from '@prisma/client';

import { BaseController } from '@/controllers/base.controller.js';

import { ModuleService } from './modules.service.js';

export class ModuleController extends BaseController<Module> {
  constructor(private readonly modulesService: ModuleService) {
    super(modulesService);
  }
}
