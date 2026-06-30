import {
  withCreatedBy,
  withDeletedBy,
  withRestoredBy,
  withUpdatedBy,
} from '@/decorators/audit.decorators.js';
import { env } from '@/config/env.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { BaseCrudService } from './base-crud.service.js';

export abstract class BaseAuditService<T> extends BaseCrudService<T> {
  protected abstract readonly moduleSlug: string;
  protected trashRetentionDays = 90;

  private cachedModuleId: string | null = null;

  protected async getModuleId(): Promise<string> {
    if (this.cachedModuleId) return this.cachedModuleId;

    const moduleRecord = await this.repository.prisma.module.findUnique({
      where: { slug: this.moduleSlug },
      select: { id: true },
    });

    if (!moduleRecord) {
      throw new HttpError(500, `Module with slug "${this.moduleSlug}" not found in database`);
    }

    this.cachedModuleId = moduleRecord.id;
    return this.cachedModuleId;
  }

  protected getRecordDisplayName(record: any): string {
    return record.name ?? record.fileName ?? record.title ?? 'Registro sin nombre';
  }

  public getAuditWhere(isTrash: boolean, extraFilters: Record<string, any> = {}) {
    return {
      ...this.getStatusFilter(isTrash),
      ...this.buildWhereFilters(extraFilters),
    };
  }

  // ==========================================
  // METODOS AUXILIARES DE AUDITORIA
  // ==========================================

  protected scrubSensitiveFields(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitiveKeys = ['password', 'token', 'secret', 'accessToken', 'refreshToken', 'idToken'];
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubSensitiveFields(item));
    }

    const cleanObj = { ...obj };
    for (const key of Object.keys(cleanObj)) {
      if (sensitiveKeys.includes(key)) {
        cleanObj[key] = '[REDACTED]';
      } else if (cleanObj[key] && typeof cleanObj[key] === 'object' && !(cleanObj[key] instanceof Date)) {
        cleanObj[key] = this.scrubSensitiveFields(cleanObj[key]);
      }
    }
    return cleanObj;
  }

  protected scrubSensitiveValue(key: string, value: any): any {
    const sensitiveKeys = ['password', 'token', 'secret', 'accessToken', 'refreshToken', 'idToken'];
    if (sensitiveKeys.includes(key)) {
      return '[REDACTED]';
    }
    return value;
  }

  protected getChangesDiff(before: any, after: any): Record<string, { before: any; after: any }> {
    const diff: Record<string, { before: any; after: any }> = {};
    if (!before || !after) return diff;

    const ignoredKeys = [
      'updatedAt',
      'updatedBy',
      'createdAt',
      'createdBy',
      'deletedAt',
      'deletedBy',
      'restoredAt',
      'restoredBy',
    ];

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (ignoredKeys.includes(key)) continue;

      const valBefore = before[key];
      const valAfter = after[key];

      let isDifferent = false;
      if (valBefore instanceof Date && valAfter instanceof Date) {
        isDifferent = valBefore.getTime() !== valAfter.getTime();
      } else if (valBefore && valAfter && (typeof valBefore === 'object' || typeof valAfter === 'object')) {
        isDifferent = JSON.stringify(valBefore) !== JSON.stringify(valAfter);
      } else {
        isDifferent = valBefore !== valAfter;
      }

      if (isDifferent) {
        diff[key] = {
          before: this.scrubSensitiveValue(key, valBefore),
          after: this.scrubSensitiveValue(key, valAfter),
        };
      }
    }
    return diff;
  }

  public async auditUpdate(id: string, recordBefore: any, updatedRecord: any, options: WriteOptions = {}) {
    try {
      const moduleId = await this.getModuleId();
      await this.repository.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: 'UPDATE',
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: id,
          displayName: this.getRecordDisplayName(updatedRecord),
          description: options.description || undefined,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: env.AUDIT_LOG_DETAILS_ENABLED
            ? {
                before: this.scrubSensitiveFields(recordBefore),
                after: this.scrubSensitiveFields(updatedRecord),
                changes: this.getChangesDiff(recordBefore, updatedRecord),
              }
            : undefined,
        },
      });
    } catch (error) {
      console.error('Error al guardar log de auditoría (UPDATE):', error);
    }
  }

  public async auditHardDelete(id: string, recordBefore: any, options: WriteOptions = {}) {
    try {
      const moduleId = await this.getModuleId();
      await this.repository.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: 'HARD_DELETE',
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: id,
          displayName: this.getRecordDisplayName(recordBefore),
          description: options.description || undefined,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: env.AUDIT_LOG_DETAILS_ENABLED
            ? { before: this.scrubSensitiveFields(recordBefore) }
            : undefined,
        },
      });
    } catch (error) {
      console.error('Error al guardar log de auditoría (HARD_DELETE):', error);
    }
  }

  public async auditHardDeleteMany(ids: string[], recordsBefore: any[], count: number, options: WriteOptions = {}) {
    try {
      const moduleId = await this.getModuleId();
      await this.repository.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: 'HARD_DELETE',
          moduleId,
          moduleSlug: this.moduleSlug,
          description: options.description || `Eliminación permanente masiva de ${count} registros`,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: env.AUDIT_LOG_DETAILS_ENABLED
            ? {
                count,
                records: recordsBefore.map((r: any) => ({
                  id: r.id,
                  displayName: this.getRecordDisplayName(r),
                })),
              }
            : { count },
        },
      });
    } catch (error) {
      console.error('Error al guardar log de auditoría (hardDeleteMany):', error);
    }
  }

  // ==========================================
  // 1. OPERACIONES INDIVIDUALES
  // ==========================================

  override async create(data: any, options: WriteOptions = {}): Promise<T> {
    const auditedData = { ...data, ...withCreatedBy(options.userId) };
    const auditedOptions = {
      ...options,
      include: { ...(options.include ?? {}) },
    };
    const record = await super.create(auditedData, auditedOptions);

    try {
      const moduleId = await this.getModuleId();
      await this.repository.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: 'CREATE',
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: (record as any).id,
          displayName: this.getRecordDisplayName(record),
          description: options.description || undefined,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: env.AUDIT_LOG_DETAILS_ENABLED
            ? { after: this.scrubSensitiveFields(record) }
            : undefined,
        },
      });
    } catch (error) {
      console.error('Error al guardar log de auditoría (CREATE):', error);
    }

    return record;
  }

  override async update(id: string, data: any, options: WriteOptions = {}): Promise<T> {
    const where = { id, ...this.getStatusFilter(false) };
    const record = await this.repository.findFirst({ where });
    if (!record) {
      throw new HttpError(404, 'Registro no encontrado o sin permisos');
    }

    const auditedData = { ...data, ...withUpdatedBy(options.userId) };
    const auditedOptions = {
      ...options,
      include: { ...(options.include ?? {}) },
    };

    const updatedRecord = await super.update(id, auditedData, auditedOptions) as Promise<T>;

    await this.auditUpdate(id, record, updatedRecord, options);

    return updatedRecord;
  }

  async softDelete(id: string, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({
      where: { id, ...this.getStatusFilter(false) },
      scope: options.scope,
    });
    if (!record) throw new HttpError(404, 'Registro no encontrado o sin permisos');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.trashRetentionDays);

    const moduleId = await this.getModuleId();

    const parentName = await (async () => {
      if (this.moduleSlug === 'documents' && (record as any).entityType && (record as any).entityId) {
        const modelKeys: Record<string, string> = {
          companies: 'company',
          users: 'user',
          roles: 'role',
          teams: 'team',
          modules: 'module',
        };
        const modelName = modelKeys[(record as any).entityType];
        if (modelName && (this.repository.prisma as any)[modelName]) {
          try {
            const parent = await (this.repository.prisma as any)[modelName].findFirst({
              where: { id: (record as any).entityId },
              select: { name: true },
            });
            return parent?.name ?? null;
          } catch (e) {
            return null;
          }
        }
      }
      return null;
    })();

    try {
      const [updatedRecord] = await this.repository.prisma.$transaction([
        (this.repository.prisma[this.repository.modelName] as any).update({
          where: { id },
          data: withDeletedBy(options.userId),
        }),
        this.repository.prisma.trashBin.create({
          data: {
            moduleId,
            moduleSlug: this.moduleSlug,
            entityId: id,
            displayName: this.getRecordDisplayName(record),
            deletedBy: options.userId,
            expiresAt,
            ownerId: (record as any).ownerId ?? null,
            createdBy: (record as any).createdBy ?? null,
            metadata: {
              ...((record as any).metadata && typeof (record as any).metadata === 'object' ? (record as any).metadata : {}),
              ...((record as any).entityType && { parentType: (record as any).entityType, entityType: (record as any).entityType }),
              ...((record as any).entityId && { parentId: (record as any).entityId, entityId: (record as any).entityId }),
              ...(this.moduleSlug === 'documents' && { documentId: (record as any).id, entityName: parentName }),
            },
          },
        }),
        this.repository.prisma.auditLog.create({
          data: {
            userId: options.userId,
            action: 'SOFT_DELETE',
            moduleId,
            moduleSlug: this.moduleSlug,
            entityId: id,
            displayName: this.getRecordDisplayName(record),
            description: options.description || undefined,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
          },
        }),
      ]);

      return updatedRecord as T;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al mover a la papelera: ${error.message}`);
    }
  }

  async restore(id: string, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({
      where: { id, ...this.getStatusFilter(true) },
      scope: options.scope,
    });
    if (!record) throw new HttpError(404, 'Registro no encontrado o sin permisos');

    const moduleId = await this.getModuleId();

    try {
      const [updatedRecord] = await this.repository.prisma.$transaction([
        (this.repository.prisma[this.repository.modelName] as any).update({
          where: { id },
          data: withRestoredBy(options.userId),
        }),
        this.repository.prisma.trashBin.delete({
          where: {
            moduleSlug_entityId: {
              moduleSlug: this.moduleSlug,
              entityId: id,
            },
          },
        }),
        this.repository.prisma.auditLog.create({
          data: {
            userId: options.userId,
            action: 'RESTORE',
            moduleId,
            moduleSlug: this.moduleSlug,
            entityId: id,
            displayName: this.getRecordDisplayName(record),
            description: options.description || undefined,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
          },
        }),
      ]);

      return updatedRecord as T;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al restaurar: ${error.message}`);
    }
  }

  override async hardDelete(id: string, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({
      where: { id },
      scope: options.scope,
    });
    if (!record) throw new HttpError(404, 'Registro no encontrado');

    const result = await super.hardDelete(id, options);

    await this.auditHardDelete(id, record, options);

    return result;
  }

  // ==========================================
  // 2. LECTURAS
  // ==========================================

  override async findList(params: {
    where?: any;
    take?: number;
    orderBy?: any;
    select?: any;
    isTrash?: boolean;
    scope?: any;
  }): Promise<T[]> {
    return this.repository.findMany({
      where: this.getAuditWhere(params.isTrash ?? false, params.where),
      take: params.take ?? 20,
      orderBy: params.orderBy ?? { name: 'asc' },
      select: { id: true, name: true, ...(params.select ?? {}) },
    }) as Promise<T[]>;
  }

  // ==========================================
  // 3. OPERACIONES CON CONTEXTO
  // ==========================================

  override async updateWithContext(where: any, data: any, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({ where });
    if (!record) {
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }

    try {
      const auditedData = { ...data, ...withUpdatedBy(options.userId) };
      const updatedRecord = await this.repository.update({
        where,
        data: auditedData,
      });

      await this.auditUpdate((updatedRecord as any).id, record, updatedRecord, options);

      return updatedRecord;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al actualizar con contexto: ${(error as Error).message}`);
    }
  }

  async softDeleteWithContext(where: any, userId: string, extraOptions: { ipAddress?: string; userAgent?: string; description?: string } = {}): Promise<T> {
    const record = await this.repository.findFirst({ where });
    if (!record) throw new HttpError(404, 'Registro no encontrado en este contexto');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.trashRetentionDays);

    const moduleId = await this.getModuleId();

    const parentName = await (async () => {
      if (this.moduleSlug === 'documents' && (record as any).entityType && (record as any).entityId) {
        const modelKeys: Record<string, string> = {
          companies: 'company',
          users: 'user',
          roles: 'role',
          teams: 'team',
          modules: 'module',
        };
        const modelName = modelKeys[(record as any).entityType];
        if (modelName && (this.repository.prisma as any)[modelName]) {
          try {
            const parent = await (this.repository.prisma as any)[modelName].findFirst({
              where: { id: (record as any).entityId },
              select: { name: true },
            });
            return parent?.name ?? null;
          } catch (e) {
            return null;
          }
        }
      }
      return null;
    })();

    try {
      const [updatedRecord] = await this.repository.prisma.$transaction([
        (this.repository.prisma[this.repository.modelName] as any).update({
          where: { id: (record as any).id },
          data: withDeletedBy(userId),
        }),
        this.repository.prisma.trashBin.create({
          data: {
            moduleId,
            moduleSlug: this.moduleSlug,
            entityId: (record as any).id,
            displayName: this.getRecordDisplayName(record),
            deletedBy: userId,
            expiresAt,
            ownerId: (record as any).ownerId ?? null,
            createdBy: (record as any).createdBy ?? null,
            metadata: {
              ...((record as any).metadata && typeof (record as any).metadata === 'object' ? (record as any).metadata : {}),
              ...((record as any).entityType && { parentType: (record as any).entityType, entityType: (record as any).entityType }),
              ...((record as any).entityId && { parentId: (record as any).entityId, entityId: (record as any).entityId }),
              ...(this.moduleSlug === 'documents' && { documentId: (record as any).id, entityName: parentName }),
            },
          },
        }),
        this.repository.prisma.auditLog.create({
          data: {
            userId,
            action: 'SOFT_DELETE',
            moduleId,
            moduleSlug: this.moduleSlug,
            entityId: (record as any).id,
            displayName: this.getRecordDisplayName(record),
            description: extraOptions.description || undefined,
            ipAddress: extraOptions.ipAddress,
            userAgent: extraOptions.userAgent,
          },
        }),
      ]);

      return updatedRecord as T;
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al mover a la papelera en contexto: ${error.message}`);
    }
  }

  async restoreWithContext(where: any, userId?: string, extraOptions: { ipAddress?: string; userAgent?: string; description?: string } = {}): Promise<T> {
    const record = await this.repository.findFirst({ where });
    if (!record) throw new HttpError(404, 'Registro no encontrado en este contexto');

    const moduleId = await this.getModuleId();

    try {
      const [updatedRecord] = await this.repository.prisma.$transaction([
        (this.repository.prisma[this.repository.modelName] as any).update({
          where: { id: (record as any).id },
          data: withRestoredBy(userId),
        }),
        this.repository.prisma.trashBin.delete({
          where: {
            moduleSlug_entityId: {
              moduleSlug: this.moduleSlug,
              entityId: (record as any).id,
            },
          },
        }),
        this.repository.prisma.auditLog.create({
          data: {
            userId,
            action: 'RESTORE',
            moduleId,
            moduleSlug: this.moduleSlug,
            entityId: (record as any).id,
            displayName: this.getRecordDisplayName(record),
            description: extraOptions.description || undefined,
            ipAddress: extraOptions.ipAddress,
            userAgent: extraOptions.userAgent,
          },
        }),
      ]);

      return updatedRecord as T;
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al restaurar en contexto: ${error.message}`);
    }
  }

  // ==========================================
  // 4. OPERACIONES MASIVAS (BULK)
  // ==========================================

  override async createMany(data: any[], options: WriteOptions = {}) {
    const auditData = data.map((item) => ({
      ...item,
      ...withCreatedBy(options.userId),
    }));

    const result = await this.repository.createMany({
      data: auditData,
      skipDuplicates: true,
    });

    try {
      const moduleId = await this.getModuleId();
      await this.repository.prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: 'CREATE',
          moduleId,
          moduleSlug: this.moduleSlug,
          description: options.description || `Creación masiva de ${result.count} registros`,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: env.AUDIT_LOG_DETAILS_ENABLED
            ? {
                count: result.count,
                records: data.map((r) => this.scrubSensitiveFields(r)),
              }
            : { count: result.count },
        },
      });
    } catch (error) {
      console.error('Error al guardar log de auditoría (createMany):', error);
    }

    return result;
  }

  async softDeleteMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };

    const records = await this.repository.findMany({
      where: {
        id: { in: ids },
        ...this.getStatusFilter(false),
      },
      scope: options.scope,
    });

    if (!records.length) return { count: 0 };

    const validIds = records.map((r: any) => r.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.trashRetentionDays);

    const moduleId = await this.getModuleId();

    const parentLookup: Record<string, Record<string, string>> = {};
    if (this.moduleSlug === 'documents' && records.length > 0) {
      const modelKeys: Record<string, string> = {
        companies: 'company',
        users: 'user',
        roles: 'role',
        teams: 'team',
        modules: 'module',
      };
      const groupedParents: Record<string, Set<string>> = {};
      for (const record of records) {
        const entityType = (record as any).entityType;
        const entityId = (record as any).entityId;
        if (entityType && entityId) {
          groupedParents[entityType] = groupedParents[entityType] || new Set();
          groupedParents[entityType].add(entityId);
        }
      }

      for (const [entityType, idSet] of Object.entries(groupedParents)) {
        const modelName = modelKeys[entityType];
        if (modelName && (this.repository.prisma as any)[modelName]) {
          const ids = Array.from(idSet);
          try {
            const parents = await (this.repository.prisma as any)[modelName].findMany({
              where: { id: { in: ids } },
              select: { id: true, name: true },
            });
            parentLookup[entityType] = parentLookup[entityType] || {};
            for (const p of parents) {
              parentLookup[entityType][p.id] = p.name;
            }
          } catch (e) {
            // silent ignore
          }
        }
      }
    }

    const [updateResult] = await this.repository.prisma.$transaction([
      (this.repository.prisma[this.repository.modelName] as any).updateMany({
        where: { id: { in: validIds } },
        data: withDeletedBy(options.userId),
      }),
      this.repository.prisma.trashBin.createMany({
        data: records.map((record: any) => ({
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: record.id,
          displayName: this.getRecordDisplayName(record),
          deletedBy: options.userId,
          expiresAt,
          ownerId: record.ownerId ?? null,
          createdBy: record.createdBy ?? null,
          metadata: {
            ...(record.metadata && typeof record.metadata === 'object' ? record.metadata : {}),
            ...(record.entityType && { parentType: record.entityType, entityType: record.entityType }),
            ...(record.entityId && { parentId: record.entityId, entityId: record.entityId }),
            ...(this.moduleSlug === 'documents' && {
              documentId: record.id,
              entityName: (record.entityType && record.entityId && parentLookup[record.entityType]?.[record.entityId]) || null
            }),
          },
        })),
        skipDuplicates: true,
      }),
      this.repository.prisma.auditLog.createMany({
        data: records.map((record: any) => ({
          userId: options.userId,
          action: 'SOFT_DELETE' as const,
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: record.id,
          displayName: this.getRecordDisplayName(record),
          description: options.description || undefined,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        })),
      }),
    ]);

    return updateResult;
  }

  async restoreMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };

    const records = await this.repository.findMany({
      where: {
        id: { in: ids },
        ...this.getStatusFilter(true),
      },
      scope: options.scope,
    });

    if (!records.length) return { count: 0 };

    const validIds = records.map((r: any) => r.id);
    const moduleId = await this.getModuleId();

    const [updateResult] = await this.repository.prisma.$transaction([
      (this.repository.prisma[this.repository.modelName] as any).updateMany({
        where: { id: { in: validIds } },
        data: withRestoredBy(options.userId),
      }),
      this.repository.prisma.trashBin.deleteMany({
        where: {
          moduleSlug: this.moduleSlug,
          entityId: { in: validIds },
        },
      }),
      this.repository.prisma.auditLog.createMany({
        data: records.map((record: any) => ({
          userId: options.userId,
          action: 'RESTORE' as const,
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: record.id,
          displayName: this.getRecordDisplayName(record),
          description: options.description || undefined,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        })),
      }),
    ]);

    return updateResult;
  }

  override async hardDeleteMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };
    const records = await this.repository.findMany({
      where: { id: { in: ids } },
      scope: options.scope,
    });

    const result = await super.hardDeleteMany(ids, options);

    await this.auditHardDeleteMany(ids, records, result.count, options);

    return result;
  }

  // ==========================================
  // 5. OPERACIONES MASIVAS CON CONTEXTO
  // ==========================================

  async softDeleteManyWithContext(where: any, userId?: string, extraOptions: { ipAddress?: string; userAgent?: string; description?: string } = {}) {
    const records = await this.repository.findMany({ where });
    if (!records.length) return { count: 0 };

    const validIds = records.map((r: any) => r.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.trashRetentionDays);

    const moduleId = await this.getModuleId();

    const parentLookup: Record<string, Record<string, string>> = {};
    if (this.moduleSlug === 'documents' && records.length > 0) {
      const modelKeys: Record<string, string> = {
        companies: 'company',
        users: 'user',
        roles: 'role',
        teams: 'team',
        modules: 'module',
      };
      const groupedParents: Record<string, Set<string>> = {};
      for (const record of records) {
        const entityType = (record as any).entityType;
        const entityId = (record as any).entityId;
        if (entityType && entityId) {
          groupedParents[entityType] = groupedParents[entityType] || new Set();
          groupedParents[entityType].add(entityId);
        }
      }

      for (const [entityType, idSet] of Object.entries(groupedParents)) {
        const modelName = modelKeys[entityType];
        if (modelName && (this.repository.prisma as any)[modelName]) {
          const ids = Array.from(idSet);
          try {
            const parents = await (this.repository.prisma as any)[modelName].findMany({
              where: { id: { in: ids } },
              select: { id: true, name: true },
            });
            parentLookup[entityType] = parentLookup[entityType] || {};
            for (const p of parents) {
              parentLookup[entityType][p.id] = p.name;
            }
          } catch (e) {
            // silent ignore
          }
        }
      }
    }

    const [updateResult] = await this.repository.prisma.$transaction([
      (this.repository.prisma[this.repository.modelName] as any).updateMany({
        where: { id: { in: validIds } },
        data: withDeletedBy(userId),
      }),
      this.repository.prisma.trashBin.createMany({
        data: records.map((record: any) => ({
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: record.id,
          displayName: this.getRecordDisplayName(record),
          deletedBy: userId,
          expiresAt,
          ownerId: record.ownerId ?? null,
          createdBy: record.createdBy ?? null,
          metadata: {
            ...(record.metadata && typeof record.metadata === 'object' ? record.metadata : {}),
            ...(record.entityType && { parentType: record.entityType, entityType: record.entityType }),
            ...(record.entityId && { parentId: record.entityId, entityId: record.entityId }),
            ...(this.moduleSlug === 'documents' && {
              documentId: record.id,
              entityName: (record.entityType && record.entityId && parentLookup[record.entityType]?.[record.entityId]) || null
            }),
          },
        })),
        skipDuplicates: true,
      }),
      this.repository.prisma.auditLog.createMany({
        data: records.map((record: any) => ({
          userId,
          action: 'SOFT_DELETE' as const,
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: record.id,
          displayName: this.getRecordDisplayName(record),
          ipAddress: extraOptions.ipAddress,
          userAgent: extraOptions.userAgent,
          description: extraOptions.description || undefined,
        })),
      }),
    ]);

    return updateResult;
  }

  async restoreManyWithContext(where: any, userId?: string, extraOptions: { ipAddress?: string; userAgent?: string; description?: string } = {}) {
    const records = await this.repository.findMany({ where });
    if (!records.length) return { count: 0 };

    const validIds = records.map((r: any) => r.id);
    const moduleId = await this.getModuleId();

    const [updateResult] = await this.repository.prisma.$transaction([
      (this.repository.prisma[this.repository.modelName] as any).updateMany({
        where: { id: { in: validIds } },
        data: withRestoredBy(userId),
      }),
      this.repository.prisma.trashBin.deleteMany({
        where: {
          moduleSlug: this.moduleSlug,
          entityId: { in: validIds },
        },
      }),
      this.repository.prisma.auditLog.createMany({
        data: records.map((record: any) => ({
          userId,
          action: 'RESTORE' as const,
          moduleId,
          moduleSlug: this.moduleSlug,
          entityId: record.id,
          displayName: this.getRecordDisplayName(record),
          ipAddress: extraOptions.ipAddress,
          userAgent: extraOptions.userAgent,
          description: extraOptions.description || undefined,
        })),
      }),
    ]);

    return updateResult;
  }

  override async hardDeleteManyWithContext(where: any, options: WriteOptions = {}) {
    const records = await this.repository.findMany({ where });
    if (!records.length) return { count: 0 };

    const result = await super.hardDeleteManyWithContext(where, options);

    await this.auditHardDeleteMany(records.map((r: any) => r.id), records, result.count, options);

    return result;
  }
}
