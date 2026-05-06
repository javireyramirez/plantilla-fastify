import {
  withCreatedBy,
  withDeletedBy,
  withRestoredBy,
  withUpdatedBy,
} from '@/decorators/audit.decorators.js';
import { BaseRepository } from '@/repositories/base.repository.js';
import { HttpError } from '@/utils/http.error.js';

export abstract class BaseAuditService<T> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  protected abstract getStatusFilter(isTrash: boolean): object;

  protected getAuditWhere(isTrash: boolean, extraWhere: object = {}) {
    return {
      ...extraWhere,
      ...this.getStatusFilter(isTrash),
    };
  }

  async create(data: any, userId?: string): Promise<T> {
    const auditedData = { ...data, ...withCreatedBy(userId) };
    try {
      return await this.repository.create(auditedData);
    } catch (error) {
      throw new HttpError(500, `Error al crear el registro: ${(error as Error).message}`);
    }
  }

  async update(id: string, data: any, userId?: string): Promise<T> {
    const auditedData = { ...data, ...withUpdatedBy(userId) };
    try {
      return await this.repository.update(id, auditedData);
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }
  }

  async softDelete(id: string, userId?: string): Promise<T> {
    try {
      return await this.repository.update(id, withDeletedBy(userId));
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado para borrar');
    }
  }

  async restore(id: string, userId?: string): Promise<T> {
    try {
      return await this.repository.update(id, withRestoredBy(userId));
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado para restaurar');
    }
  }

  async softDeleteMany(ids: string[], userId?: string) {
    return this.repository.updateMany({ id: { in: ids } }, withDeletedBy(userId));
  }

  async restoreMany(ids: string[], userId?: string) {
    return this.repository.updateMany({ id: { in: ids } }, withRestoredBy(userId));
  }

  async createManyWithAudit(data: any[], userId?: string) {
    const auditData = data.map((item) => ({
      ...item,
      ...withCreatedBy(userId),
    }));
    return this.repository.createMany(auditData);
  }

  async softDeleteWithContext(where: any, userId?: string): Promise<T> {
    try {
      return await this.repository.updateWithContext(where, withDeletedBy(userId));
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado en este contexto');
    }
  }

  async restoreWithContext(where: any, userId?: string): Promise<T> {
    try {
      return await this.repository.updateWithContext(where, withRestoredBy(userId));
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado en este contexto');
    }
  }
}
