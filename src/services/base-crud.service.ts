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

  //Includes
  protected getDefaultInclude() {
    return {};
  }

  protected getDefaultListInclude() {
    return this.getDefaultInclude();
  }

  // Filtros texto
  protected buildStringFilter(field: string, value?: string) {
    return value ? { [field]: { contains: value, mode: 'insensitive' } } : {};
  }

  // Filtros booleanos
  protected buildBooleanFilter(field: string, value?: boolean | string) {
    if (value === undefined || value === null) return {};

    if (typeof value === 'string') {
      if (value === 'true') return { [field]: true };
      if (value === 'false') return { [field]: false };
      return {};
    }

    return { [field]: value };
  }

  // Filtros seleccion
  protected buildExactMatchFilters(filters: Record<string, any>, fields: string[]) {
    const where: any = {};
    for (const field of fields) {
      const val = filters[field];
      if (val !== undefined && val !== null) {
        where[field] = Array.isArray(val) ? { in: val } : val;
      }
    }
    return where;
  }

  protected buildMultiSelectFilter(field: string, value: any) {
    if (!value) return {};

    if (Array.isArray(value)) {
      return { [field]: { in: value } };
    }

    if (typeof value === 'string') {
      const values = value.split(',');
      return { [field]: { in: values } };
    }

    return {};
  }

  // Filtros fechas
  protected buildDateRangeFilter(field: string, from?: Date | string, to?: Date | string) {
    if (!from && !to) return {};

    return {
      [field]: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }),
      },
    };
  }

  // Construcción de filtros
  protected abstract buildWhereFilters(filters: Record<string, any>): object;

  protected abstract getStatusFilter(isTrash: boolean): object;

  //Ordenamiento
  protected getAvailableSorts(): Record<string, object> {
    return {};
  }

  public buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') {
    if (!sortBy) return { createdAt: 'desc' };

    const relational = this.getAvailableSorts();
    if (sortBy in relational) {
      return JSON.parse(
        JSON.stringify(relational[sortBy]).replace('"__order__"', `"${sortOrder}"`),
      );
    }

    return { [sortBy]: sortOrder };
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
        ...this.getDefaultInclude(),

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
        ...this.getDefaultListInclude(),

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
