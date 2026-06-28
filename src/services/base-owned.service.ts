import { FastifyInstance } from 'fastify';

import { withDeletedBy, withRestoredBy } from '@/decorators/audit.decorators.js';
import { WriteOptions } from '@/types/base.types.js';
import { ScopeContext } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

import { BaseAuditService } from './base-audit.service.js';

export abstract class BaseRbacService<T> extends BaseAuditService<T> {
  protected getDefaultInclude(): object {
    return {
      owner: {
        select: { name: true, email: true },
      },
    };
  }
  // ==========================================
  // 1. OPERACIONES INDIVIDUALES
  // ==========================================

  override async update(id: string, data: any, options: WriteOptions = {}): Promise<T> {
    try {
      return await this.repository.update({
        where: { id, ...this.getStatusFilter(false) },
        data: { ...data },
        include: { ...(options.include ?? {}) },
        select: options.select,
        scope: options.scope,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al actualizar el registro: ${error.message}`);
    }
  }


  override async hardDelete(id: string, options: WriteOptions = {}): Promise<T> {
    try {
      return await this.repository.delete({
        where: { id },
        scope: options.scope,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, `Error al eliminar el registro: ${error.message}`);
    }
  }

  // ==========================================
  // 2. LECTURA Y CONTEXTO
  // ==========================================

  override async findFirst(
    params: { where?: any; include?: any; orderBy?: any; select?: any; scope?: ScopeContext } = {},
  ): Promise<T | null> {
    return this.repository.findFirst({
      ...params,
      include: {
        ...this.getDefaultInclude(),
        ...(params.include || {}),
      },
    });
  }

  override async findManyWithCount(params: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
    select?: any;
    scope?: ScopeContext;
  }): Promise<{ data: T[]; total: number }> {
    return this.repository.findManyWithCount({
      ...params,
      include: {
        ...this.getDefaultInclude(),
        ...(params.include || {}),
      },
    });
  }

  override async findList(params: {
    where?: any;
    take?: number;
    orderBy?: any;
    select?: any;
    isTrash?: boolean;
    scope?: ScopeContext;
  }): Promise<T[]> {
    return this.repository.findMany({
      where: this.getAuditWhere(params.isTrash ?? false, params.where),
      take: params.take ?? 20,
      orderBy: params.orderBy ?? { name: 'asc' },
      select: {
        id: true,
        name: true,
        ...(params.select ?? {}),
      },
      scope: params.scope,
    });
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================


  override async hardDeleteMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };
    return this.repository.deleteMany({
      where: { id: { in: ids } },
      scope: options.scope,
    });
  }
}
