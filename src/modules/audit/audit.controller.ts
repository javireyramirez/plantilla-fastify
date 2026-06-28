import { BaseController } from '@/controllers/base.controller.js';
import { AuditLogType } from './audit.schema.js';
import { AuditLogService } from './audit.service.js';

export class AuditLogController extends BaseController<AuditLogType> {
  constructor(private readonly auditLogService: AuditLogService) {
    super(auditLogService);
  }
}
