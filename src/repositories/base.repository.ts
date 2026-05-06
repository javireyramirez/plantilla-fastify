import { FastifyInstance } from 'fastify';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: FastifyInstance['prisma'],
    protected readonly modelName: string,
  ) {}

  protected get model() {
    return (this.prisma as any)[this.modelName];
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

  // ==========================================
  // 2. ESCRITURA INDIVIDUAL (WRITE)
  // ==========================================

  async create(params: { data: any; include?: any; select?: any }): Promise<T> {
    // Nota: Cambiamos a recibir un objeto params para soportar include/select
    return this.model.create(params);
  }

  async update(params: { where: any; data: any; include?: any; select?: any }): Promise<T> {
    return this.model.update(params);
  }

  async delete(params: { where: any; include?: any; select?: any }): Promise<T> {
    return this.model.delete(params);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async createMany(params: { data: any[]; skipDuplicates?: boolean }) {
    // Prisma no soporta 'include' en createMany en la mayoría de conectores
    return this.model.createMany(params);
  }

  async updateMany(params: { where: any; data: any }) {
    return this.model.updateMany(params);
  }

  async deleteMany(params: { where: any }) {
    return this.model.deleteMany(params);
  }
}
