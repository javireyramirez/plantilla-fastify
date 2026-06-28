import {
  withCreatedBy,
  withDeletedBy,
  withRestoredBy,
  withUpdatedBy,
} from '@/decorators/audit.decorators.js';
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
  // 1. OPERACIONES INDIVIDUALES
  // ==========================================

  override async create(data: any, options: WriteOptions = {}): Promise<T> {
    const auditedData = { ...data, ...withCreatedBy(options.userId) };
    const auditedOptions = {
      ...options,
      include: { ...(options.include ?? {}) },
    };
    return super.create(auditedData, auditedOptions);
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

    return super.update(id, auditedData, auditedOptions) as Promise<T>;
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
              ...((record as any).entityType && { parentType: (record as any).entityType }),
              ...((record as any).entityId && { parentId: (record as any).entityId }),
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
  // 2. Operaciones con contexto
  // ==========================================
  override async updateWithContext(where: any, data: any, options: WriteOptions = {}): Promise<T> {
    try {
      return await this.repository.update({
        where,
        data: { ...data, ...withUpdatedBy(options.userId) },
      });
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }
  }

  async softDeleteWithContext(where: any, userId: string): Promise<T> {
    const record = await this.repository.findFirst({ where });
    if (!record) throw new HttpError(404, 'Registro no encontrado en este contexto');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.trashRetentionDays);

    const moduleId = await this.getModuleId();

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
              ...((record as any).entityType && { parentType: (record as any).entityType }),
              ...((record as any).entityId && { parentId: (record as any).entityId }),
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
          },
        }),
      ]);

      return updatedRecord as T;
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al mover a la papelera en contexto: ${error.message}`);
    }
  }

  async restoreWithContext(where: any, userId?: string): Promise<T> {
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
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  override async createMany(data: any[], options: WriteOptions = {}) {
    const auditData = data.map((item) => ({
      ...item,
      ...withCreatedBy(options.userId),
    }));

    return this.repository.createMany({
      data: auditData,
      skipDuplicates: true,
    });
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
            ...(record.entityType && { parentType: record.entityType }),
            ...(record.entityId && { parentId: record.entityId }),
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
        })),
      }),
    ]);

    return updateResult;
  }

  // ==========================================
  // 4. OPERACIONES MASIVAS CON CONTEXTO
  // ==========================================

  async softDeleteManyWithContext(where: any, userId?: string) {
    const records = await this.repository.findMany({ where });
    if (!records.length) return { count: 0 };

    const validIds = records.map((r: any) => r.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.trashRetentionDays);

    const moduleId = await this.getModuleId();

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
            ...(record.entityType && { parentType: record.entityType }),
            ...(record.entityId && { parentId: record.entityId }),
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
        })),
      }),
    ]);

    return updateResult;
  }

  async restoreManyWithContext(where: any, userId?: string) {
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
        })),
      }),
    ]);

    return updateResult;
  }

  async hardDeleteManyWithContext(where: any) {
    return this.repository.deleteMany({ where });
  }
}
