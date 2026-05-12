import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: keyof PrismaClient,
  ) {}

  protected get model() {
    return this.prisma[this.modelName] as any;
  }

  // ==========================================
  // 1. LECTURA (READ)
  // ==========================================
  async findFirst(params: {
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }): Promise<T | null> {
    return this.model.findFirst(params);
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
  }): Promise<T[]> {
    return this.model.findMany(params);
  }

  async count(where: any = {}): Promise<number> {
    return this.model.count({ where });
  }

  // Paginación en una sola query (transaction)
  async findManyWithCount(params: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
    select?: any;
  }): Promise<{ data: T[]; total: number }> {
    const [data, total] = await this.prisma.$transaction([
      this.model.findMany(params),
      this.model.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.model.count({ where });
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

  async updateMany(params: { where: any; data: any }) {
    return this.model.updateMany(params);
  }

  async deleteMany(params: { where: any }) {
    return this.model.deleteMany(params);
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
