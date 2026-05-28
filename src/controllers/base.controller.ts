import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateSchema } from '@/schemas/base.schema.js';
import { BaseAuditService } from '@/services/base.service.js';
import { HttpError } from '@/utils/http.error.js';
import { parsePagination } from '@/utils/pagination.js';
import { requireScope } from '@/utils/scope.js';

export abstract class BaseController<T> {
  constructor(protected readonly service: BaseAuditService<T>) {}

  // ==========================================
  // 1. LECTURA (READ)
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

    const shouldShowTrash = String(isTrash) === 'true';
    const scope = requireScope(request);

    const result = await this.service.findManyWithCount({
      where: this.service.getAuditWhere(shouldShowTrash, filters),
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
    const isTrash = request.query.isTrash === 'true';
    const scope = requireScope(request);

    const record = await this.service.findFirst({
      where: {
        id,
        ...this.service.getAuditWhere(isTrash),
      },
      scope,
    });

    if (!record) {
      throw new HttpError(404, 'Registro no encontrado');
    }

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
  // 2. ESCRITURA INDIVIDUAL (WRITE)
  // ==========================================

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.session as any)?.user?.id;
    const memberCtx = request.memberContext;

    const body = CreateSchema.parse(request.body);

    const data = {
      ...body,
      ownerId: body.ownerId || userId,
      ownerOrganizationId: body.ownerOrganizationId || memberCtx?.organizationId,
    };

    const record = await this.service.create(data, userId);
    return reply.code(201).send(record);
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: any }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const userId = (request.session as any)?.user?.id;
    const scope = requireScope(request);

    const record = await this.service.update(id, request.body, userId, { scope });
    return reply.send(record);
  }

  // ==========================================
  // 3. ESTADOS Y BORRADO INDIVIDUAL
  // ==========================================

  async softDelete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request.session as any)?.user?.id;
    const scope = requireScope(request);

    const record = await this.service.softDelete(id, userId, scope);
    return reply.send(record);
  }

  async restore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const userId = (request.session as any)?.user?.id;
    const scope = requireScope(request);

    const record = await this.service.restore(id, userId, scope);
    return reply.send(record);
  }

  async deletePermanent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const scope = requireScope(request);

    await this.service.hardDelete(id, scope);
    return reply.code(204).send();
  }

  // ==========================================
  // 4. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async createMany(request: FastifyRequest<{ Body: any[] }>, reply: FastifyReply) {
    const userId = (request.session as any)?.user?.id;
    const memberCtx = request.memberContext;

    const payload = request.body.map((item) => ({
      ...item,
      ownerId: item.ownerId || userId,
      ownerOrganizationId: item.ownerOrganizationId || memberCtx?.organizationId,
    }));

    const result = await this.service.createManyWithAudit(payload, userId);
    return reply.code(201).send(result);
  }

  async softDeleteMany(request: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
    const userId = (request.session as any)?.user?.id;
    const { ids } = request.body;
    const scope = requireScope(request);

    const result = await this.service.softDeleteMany(ids, userId, scope);
    return reply.send(result);
  }

  async restoreMany(request: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
    const userId = (request.session as any)?.user?.id;
    const { ids } = request.body;
    const scope = requireScope(request);

    const result = await this.service.restoreMany(ids, userId, scope);
    return reply.send(result);
  }

  async deletePermanentMany(
    request: FastifyRequest<{ Body: { ids: string[] } }>,
    reply: FastifyReply,
  ) {
    const { ids } = request.body;
    const scope = requireScope(request);

    const result = await this.service.hardDeleteMany(ids, scope);
    return reply.send(result);
  }
}
