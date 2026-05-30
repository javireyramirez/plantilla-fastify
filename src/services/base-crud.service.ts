import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';
import { WriteOptions } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

type PrismaTransaction = Omit<
  FastifyInstance['prisma'],
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export abstract class BaseCrudService<T> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  protected abstract getStatusFilter(isTrash: boolean): object;

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

  async create(data: any, options: WriteOptions = {}): Promise<T> {
    try {
      return await this.repository.create({
        data: { ...data },
        include: { ...(options.include ?? {}) },
        select: options.select,
      });
    } catch (error) {
      throw new HttpError(500, `Error al crear el registro: ${(error as Error).message}`);
    }
  }

  async update(id: string, data: any, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({ where: { id } } as any);
    if (!record) throw new HttpError(404, 'Registro no encontrado');
    try {
      return await this.repository.update({
        where: { id },
        data: { ...data },
        include: { ...(options.include ?? {}) },
        select: options.select,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }
  }

  async hardDelete(id: string, options: WriteOptions = {}): Promise<T> {
    const record = await this.repository.findFirst({ where: { id } } as any);
    if (!record) throw new HttpError(404, 'Registro no encontrado');
    try {
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
    params: { where?: any; include?: any; orderBy?: any; select?: any; scope?: any } = {},
  ): Promise<T | null> {
    return this.repository.findFirst({
      ...params,
      include: {
        ...(params.include || {}),
      },
    });
  }

  async findByIdWithContext(id: string, context: any): Promise<T | null> {
    return this.repository.findFirst({
      where: { id, ...context },
    });
  }

  async exists(params: any, options: WriteOptions = {}): Promise<boolean> {
    return this.repository.exists(params);
  }

  async findManyWithCount(params: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
    select?: any;
    scope?: any;
  }): Promise<{ data: T[]; total: number }> {
    return this.repository.findManyWithCount({
      ...params,
      include: {
        ...(params.include || {}),
      },
    });
  }

  async findList(params: {
    where?: any;
    take?: number;
    orderBy?: any;
    select?: any;
  }): Promise<T[]> {
    return this.repository.findMany({
      where: params.where,
      take: params.take ?? 20,
      orderBy: params.orderBy ?? { name: 'asc' },
      select: {
        id: true,
        name: true,
        ...(params.select ?? {}),
      },
    });
  }

  async updateWithContext(where: any, data: any, options: WriteOptions = {}): Promise<T> {
    try {
      return await this.repository.update({
        where,
        data: { ...data },
      });
    } catch (error) {
      throw new HttpError(404, 'Registro no encontrado para actualizar');
    }
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async createMany(data: any[], options: WriteOptions = {}) {
    return this.repository.createMany({
      data: data,
      skipDuplicates: true,
    });
  }

  public async hardDeleteMany(ids: string[], options: WriteOptions = {}) {
    if (!ids.length) return { count: 0 };
    return this.repository.deleteMany({
      where: { id: { in: ids } },
    });
  }

  // ==========================================
  // 4. OPERACIONES MASIVAS CON CONTEXTO
  // ==========================================

  async hardDeleteManyWithContext(where: any, options: WriteOptions = {}) {
    return this.repository.deleteMany({ where });
  }

  // ==========================================
  // 5. TRANSACCIONES
  // ==========================================

  async transaction<R>(fn: (tx: PrismaTransaction) => Promise<R>): Promise<R> {
    return this.repository.transaction(fn as any);
  }
}
