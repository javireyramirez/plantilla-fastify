// repositories/base.repository.ts
import { PermissionScope } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

// ==========================================
// SCOPE
// ==========================================

export interface ScopeContext {
  scope: PermissionScope;
  userId: string;
  organizationId: string;
  teamIds: string[];
}

export function buildScopeFilter(ctx: ScopeContext): Record<string, any> {
  switch (ctx.scope) {
    case 'GLOBAL':
      return {};
    case 'ORGANIZATION':
      return { ownerOrganizationId: ctx.organizationId };
    case 'TEAM':
      return { ownerTeamId: { in: ctx.teamIds } };
    case 'OWN':
      return { ownerId: ctx.userId };
  }
}

// ==========================================
// BASE REPOSITORY
// ==========================================

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: keyof PrismaClient,
  ) {}

  protected get model() {
    return this.prisma[this.modelName] as any;
  }

  // Mezcla el where del caller con el filtro de scope
  protected mergeScope(where: any = {}, scope?: ScopeContext): any {
    if (!scope) return where;
    return { ...where, ...buildScopeFilter(scope) };
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
  // OWNERSHIP CHECK (para findUnique + mutaciones)
  // ==========================================
  //
  // Verifica que el registro encontrado pertenece al scope del usuario.
  // Úsalo después de findUnique antes de UPDATE/DELETE.

  checkOwnership(record: any, ctx: ScopeContext): boolean {
    switch (ctx.scope) {
      case 'GLOBAL':
        return true;
      case 'ORGANIZATION':
        return record.ownerOrganizationId === ctx.organizationId;
      case 'TEAM':
        return ctx.teamIds.includes(record.ownerTeamId);
      case 'OWN':
        return record.ownerId === ctx.userId;
    }
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
