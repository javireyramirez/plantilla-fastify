import { FastifyInstance } from 'fastify';

import {
  withCreatedBy,
  withDeletedBy,
  withRestoredBy,
  withUpdatedBy,
} from '@/decorators/audit.decorators.js';
import { BaseRepository, ScopeContext } from '@/repositories/base.repository.js';
import { HttpError } from '@/utils/http.error.js';

const defaultInclude = {
  owner: {
    select: {
      name: true,
      email: true,
    },
  },
};

type PrismaTransaction = Omit<
  FastifyInstance['prisma'],
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export abstract class BaseAuditService<T> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  protected abstract getStatusFilter(isTrash: boolean): object;

  public getAuditWhere(isTrash: boolean, extraWhere: object = {}) {
    return {
      ...extraWhere,
      ...this.getStatusFilter(isTrash),
    };
  }

  protected async ensureNotSystem(
    id: string,
    errorMessage = 'No se puede modificar un registro de sistema',
  ) {
    const record = await this.repository.findFirst({ where: { id } } as any);

    if (record && (record as any).isSystem) {
      throw new HttpError(403, errorMessage);
    }
  }

  // ==========================================
  // 1. OPERACIONES INDIVIDUALES
  // ==========================================

  async create(
    data: any,
    userId?: string,
    options: { include?: any; select?: any } = {},
  ): Promise<T> {
    try {
      return await this.repository.create({
        data: { ...data, ...withCreatedBy(userId, data?.ownerId) },
        include: { ...defaultInclude, ...(options.include ?? {}) },
        select: options.select,
      });
    } catch (error) {
      throw new HttpError(500, `Error al crear el registro: ${(error as Error).message}`);
    }
  }

  async update(
    id: string,
    data: any,
    userId?: string,
    options: { include?: any; select?: any; scope?: ScopeContext } = {},
  ): Promise<T> {
    try {
      // 1. Verificar existencia y pertenencia al scope antes de mutar
      const where = { id, ...this.getStatusFilter(false) };
      const record = await this.repository.findFirst({ where, scope: options.scope });
      if (!record) {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }

      // 2. Ejecutar actualización
      return await this.repository.update({
        where: { id },
        data: { ...data, ...withUpdatedBy(userId) },
        include: { ...defaultInclude, ...(options.include ?? {}) },
        select: options.select,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }
  }

  async upsert(params: { where: any; create: any; update: any }, userId?: string): Promise<T> {
    try {
      return await this.repository.upsert({
        where: params.where,
        create: { ...params.create, ...withCreatedBy(userId) },
        update: { ...params.update, ...withUpdatedBy(userId) },
      });
    } catch (error) {
      throw new HttpError(500, `Error en upsert: ${(error as Error).message}`);
    }
  }

  async softDelete(id: string, userId?: string, scope?: ScopeContext): Promise<T> {
    try {
      const record = await this.repository.findFirst({ where: { id }, scope });
      if (!record) {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }

      return await this.repository.update({
        where: { id },
        data: withDeletedBy(userId),
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, 'Registro no encontrado para borrar');
    }
  }

  async restore(id: string, userId?: string, scope?: ScopeContext): Promise<T> {
    try {
      const record = await this.repository.findFirst({ where: { id }, scope });
      if (!record) {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }

      return await this.repository.update({
        where: { id },
        data: withRestoredBy(userId),
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, 'Registro no encontrado para restaurar');
    }
  }

  async hardDelete(id: string, scope?: ScopeContext): Promise<T> {
    try {
      const record = await this.repository.findFirst({ where: { id }, scope });
      if (!record) {
        throw new HttpError(404, 'Registro no encontrado o sin permisos');
      }

      return await this.repository.delete({ where: { id } });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, 'Registro no encontrado para eliminar permanentemente');
    }
  }

  // ==========================================
  // 2. LECTURA Y CONTEXTO
  // ==========================================

  async findFirst(
    params: { where?: any; include?: any; orderBy?: any; select?: any; scope?: ScopeContext } = {},
  ): Promise<T | null> {
    return this.repository.findFirst({
      ...params,
      include: {
        ...defaultInclude,
        ...(params.include || {}),
      },
    });
  }

  async findByIdWithContext(id: string, context: any): Promise<T | null> {
    return this.repository.findFirst({
      where: { id, ...context },
    });
  }

  async exists(params: any): Promise<boolean> {
    return this.repository.exists(params);
  }

  async findManyWithCount(params: {
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
        ...defaultInclude,
        ...(params.include || {}),
      },
    });
  }

  async findList(params: {
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

  async updateWithContext(where: any, data: any, userId?: string): Promise<T> {
    try {
      return await this.repository.update({
        where,
        data: { ...data, ...withUpdatedBy(userId) },
      });
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }
  }

  async softDeleteWithContext(where: any, userId?: string): Promise<T> {
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

  async createManyWithAudit(data: any[], userId?: string) {
    const auditData = data.map((item) => ({
      ...item,
      ...withCreatedBy(userId, item.ownerId),
    }));

    return this.repository.createMany({
      data: auditData,
      skipDuplicates: true,
    });
  }

  async softDeleteMany(ids: string[], userId?: string, scope?: ScopeContext) {
    if (!ids.length) return { count: 0 };
    return this.repository.updateMany({
      where: { id: { in: ids } },
      data: withDeletedBy(userId),
      scope,
    });
  }

  async restoreMany(ids: string[], userId?: string, scope?: ScopeContext) {
    if (!ids.length) return { count: 0 };
    return this.repository.updateMany({
      where: { id: { in: ids } },
      data: withRestoredBy(userId),
      scope,
    });
  }

  public async hardDeleteMany(ids: string[], scope?: ScopeContext) {
    if (!ids.length) return { count: 0 };
    return this.repository.deleteMany({
      where: { id: { in: ids } },
      scope,
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

  // ==========================================
  // 5. TRANSACCIONES
  // ==========================================

  async transaction<R>(fn: (tx: PrismaTransaction) => Promise<R>): Promise<R> {
    return this.repository.transaction(fn as any);
  }
}
