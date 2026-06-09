import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateSchema } from '@/schemas/base.schema.js';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { BaseRbacService } from '@/services/base-owned.service.js';
import { HttpError } from '@/utils/http.error.js';
import { parsePagination } from '@/utils/pagination.js';
import { requireScope } from '@/utils/scope.js';

export abstract class BaseController<T> {
  constructor(protected readonly service: BaseAuditService<T>) {}

  protected getUserId(request: FastifyRequest): string | undefined {
    return request.session?.user?.id;
  }

  // ==========================================
  // LECTURA
  // ==========================================

  async getAll(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    const {
      page = 1,
      limit = 10,
      isTrash = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...filters
    } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });
    const scope = requireScope(request);

    const result = await this.service.findManyWithCount({
      where: this.service.getAuditWhere(String(isTrash) === 'true', filters),
      skip,
      take,
      orderBy,
      scope,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { isTrash?: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const scope = requireScope(request);

    const record = await this.service.findFirst({
      where: {
        id,
        ...this.service.getAuditWhere(request.query.isTrash === 'true'),
      },
      scope,
    });

    if (!record) throw new HttpError(404, 'Registro no encontrado');

    return reply.send(record);
  }

  async getList(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    const { limit = 20, sortBy = 'name', sortOrder = 'asc', ...filters } = request.query as any;
    const scope = requireScope(request);

    const result = await this.service.findList({
      where: filters,
      take: Number(limit),
      orderBy: { [sortBy]: sortOrder },
      scope,
    });

    return reply.send(result);
  }

  // ==========================================
  // ESCRITURA INDIVIDUAL
  // ==========================================

  async create(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    const userId = this.getUserId(request);
    const { organizationId } = request.memberContext ?? {};

    const body = CreateSchema.parse(request.body);

    const record = await this.service.create(body, { userId });
    return reply.code(201).send(record);
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: any }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const userId = this.getUserId(request);
    const scope = requireScope(request);

    const record = await this.service.update(id, request.body, { userId, scope });
    return reply.send(record);
  }

  // ==========================================
  // ESTADOS Y BORRADO INDIVIDUAL
  // ==========================================

  async softDelete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = this.getUserId(request);
    const scope = requireScope(request);

    const record = await this.service.softDelete(id, { userId, scope });
    return reply.send(record);
  }

  async restore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = this.getUserId(request);
    const scope = requireScope(request);

    const record = await this.service.restore(id, { userId, scope });
    return reply.send(record);
  }

  async deletePermanent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const scope = requireScope(request);

    await this.service.hardDelete(id, { scope });
    return reply.code(204).send();
  }

  // ==========================================
  // BULK
  // ==========================================

  async createMany(request: FastifyRequest<{ Body: any[] }>, reply: FastifyReply) {
    const userId = this.getUserId(request);
    const { organizationId } = request.memberContext ?? {};

    const data = request.body.map((item) => ({
      ...item,
      ownerId: item.ownerId ?? userId,
      ownerOrganizationId: item.ownerOrganizationId ?? organizationId,
    }));

    const result = await this.service.createMany(data, { userId });
    return reply.code(201).send(result);
  }

  async softDeleteMany(request: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
    const userId = this.getUserId(request);
    const scope = requireScope(request);
    const { ids } = request.body;

    const result = await this.service.softDeleteMany(ids, { userId, scope });
    return reply.send(result);
  }

  async restoreMany(request: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
    const userId = this.getUserId(request);
    const scope = requireScope(request);
    const { ids } = request.body;

    const result = await this.service.restoreMany(ids, { userId, scope });
    return reply.send(result);
  }

  async deletePermanentMany(
    request: FastifyRequest<{ Body: { ids: string[] } }>,
    reply: FastifyReply,
  ) {
    const scope = requireScope(request);
    const { ids } = request.body;

    const result = await this.service.hardDeleteMany(ids, { scope });
    return reply.send(result);
  }
}
