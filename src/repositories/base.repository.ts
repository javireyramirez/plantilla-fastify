// repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { ScopeContext } from '@/types/base.types.js';
import { buildScopeFilter } from '@/utils/rbac-filter.js';

// <-- Importado de tus utils

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: keyof PrismaClient,
  ) {}

  protected get model() {
    return this.prisma[this.modelName] as any;
  }

  /**
   * Mezcla de forma segura el where original con las restricciones del RBAC
   */
  protected mergeScope(where: any = {}, scope?: ScopeContext): any {
    if (!scope) return where;

    const rbacFilter = buildScopeFilter(scope, this.modelName as string);
    if (Object.keys(rbacFilter).length === 0) return where;

    return {
      ...where,
      AND: [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), rbacFilter],
    };
  }

  // ==========================================
  // 1. LECTURA (READ)
  // ==========================================

  async findFirst(params: {
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
    scope?: ScopeContext;
  }): Promise<T | null> {
    const { scope, ...rest } = params;
    return this.model.findFirst({
      ...rest,
      where: this.mergeScope(rest.where, scope),
    });
  }

  async findUnique(params: { where: any; include?: any; select?: any }): Promise<T | null> {
    return this.model.findUnique(params);
  }

  async findMany(params: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
    select?: any;
    scope?: ScopeContext;
  }): Promise<T[]> {
    const { scope, ...rest } = params;
    return this.model.findMany({
      ...rest,
      where: this.mergeScope(rest.where, scope),
    });
  }

  async count(where: any = {}, scope?: ScopeContext): Promise<number> {
    return this.model.count({ where: this.mergeScope(where, scope) });
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
    const { scope, ...rest } = params;
    const mergedWhere = this.mergeScope(rest.where, scope);

    const [data, total] = await this.prisma.$transaction([
      this.model.findMany({ ...rest, where: mergedWhere }),
      this.model.count({ where: mergedWhere }),
    ]);

    return { data, total };
  }

  async exists(params: { where: any }): Promise<boolean> {
    const count = await this.model.count(params);
    return count > 0;
  }

  // ==========================================
  // 2. ESCRITURA INDIVIDUAL (WRITE)
  // ==========================================

  async create(params: { data: any; include?: any; select?: any }): Promise<T> {
    return this.model.create(params);
  }

  async update(params: { where: any; data: any; include?: any; select?: any }): Promise<T> {
    return this.model.update(params);
  }

  async upsert(params: {
    where: any;
    create: any;
    update: any;
    include?: any;
    select?: any;
  }): Promise<T> {
    return this.model.upsert(params);
  }

  async delete(params: { where: any; include?: any; select?: any }): Promise<T> {
    return this.model.delete(params);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async createMany(params: { data: any[]; skipDuplicates?: boolean }) {
    return this.model.createMany(params);
  }

  async updateMany(params: { where: any; data: any; scope?: ScopeContext }) {
    const { scope, ...rest } = params;
    return this.model.updateMany({
      ...rest,
      where: this.mergeScope(rest.where, scope),
    });
  }

  async deleteMany(params: { where: any; scope?: ScopeContext }) {
    const { scope, ...rest } = params;
    return this.model.deleteMany({
      ...rest,
      where: this.mergeScope(rest.where, scope),
    });
  }

  // ==========================================
  // 4. TRANSACCIONES
  // ==========================================

  async transaction<R>(
    fn: (tx: Omit<FastifyInstance['prisma'], '$transaction'>) => Promise<R>,
  ): Promise<R> {
    return this.prisma.$transaction((tx) => fn(tx as any));
  }
}
