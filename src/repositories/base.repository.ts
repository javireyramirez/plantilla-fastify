import { FastifyInstance } from 'fastify';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: FastifyInstance['prisma'],
    protected readonly modelName: string,
  ) {}

  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  async findMany(params: { where?: any; skip?: number; take?: number; orderBy?: any }) {
    return this.model.findMany(params) as Promise<T[]>;
  }

  async count(where: any = {}): Promise<number> {
    return this.model.count({ where });
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async updateWithContext(where: any, data: any): Promise<T> {
    return this.model.update({ where, data });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async createMany(data: any[], skipDuplicates = false) {
    return this.model.createMany({ data, skipDuplicates });
  }

  async updateMany(where: any, data: any) {
    return this.model.updateMany({ where, data });
  }

  async deleteMany(where: any) {
    return this.model.deleteMany({ where });
  }
}
