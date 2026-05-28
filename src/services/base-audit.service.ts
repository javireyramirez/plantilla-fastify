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
  public getAuditWhere(isTrash: boolean, extraWhere: object = {}) {
    return {
      ...extraWhere,
      ...this.getStatusFilter(isTrash),
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
    });
    if (!record) throw new HttpError(404, 'Registro no encontrado');

    return this.repository.update({
      where: { id },
      data: withDeletedBy(options.userId),
    }) as Promise<T>;
  }

  async restore(id: string, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({
      where: { id, ...this.getStatusFilter(true) },
    });
    if (!record) throw new HttpError(404, 'Registro no encontrado o sin permisos');

    return this.repository.update({
      where: { id },
      data: withRestoredBy(options.userId),
    }) as Promise<T>;
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
    try {
      return await this.repository.update({
        where,
        data: withDeletedBy(userId),
      });
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado en este contexto');
    }
  }

  async restoreWithContext(where: any, userId?: string): Promise<T> {
    try {
      return await this.repository.update({
        where,
        data: withRestoredBy(userId),
      });
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado en este contexto');
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
    return this.repository.updateMany({
      where: { id: { in: ids } },
      data: withDeletedBy(options.userId),
    });
  }

  async restoreMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };
    return this.repository.updateMany({
      where: { id: { in: ids } },
      data: withRestoredBy(options.userId),
    });
  }

  // ==========================================
  // 4. OPERACIONES MASIVAS CON CONTEXTO
  // ==========================================

  async softDeleteManyWithContext(where: any, userId?: string) {
    return this.repository.updateMany({
      where,
      data: withDeletedBy(userId),
    });
  }

  async restoreManyWithContext(where: any, userId?: string) {
    return this.repository.updateMany({
      where,
      data: withRestoredBy(userId),
    });
  }

  async hardDeleteManyWithContext(where: any) {
    return this.repository.deleteMany({ where });
  }
}
