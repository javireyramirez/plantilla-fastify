import { BaseAuditService } from '@/services/base-audit.service.js';
import { AuditLogRepository } from './audit.repository.js';
import { AuditLogType } from './audit.schema.js';

export class AuditLogService extends BaseAuditService<AuditLogType> {
  protected override readonly moduleSlug = 'audit';

  constructor(private readonly auditLogRepo: AuditLogRepository) {
    super(auditLogRepo);
  }

  protected override buildWhereFilters(filters: Record<string, any>) {
    return {
      ...this.buildExactMatchFilters(filters, ['action', 'moduleSlug', 'entityId', 'userId']),
      ...this.buildStringFilter('displayName', filters.name),
      ...this.buildDateRangeFilter('createdAt', filters.createdAtFrom, filters.createdAtTo),
    };
  }

  protected getStatusFilter(isTrash: boolean) {
    // Los logs de auditoría no tienen estado de papelera ni borrado lógico
    return {};
  }
}
