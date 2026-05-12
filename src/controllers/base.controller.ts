import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseAuditService } from '@/services/base-audit.service.js';
import { HttpError } from '@/utils/http.error.js';

export abstract class BaseController<T> {
  constructor(protected readonly service: BaseAuditService<T>) {}

  // ==========================================
  // 1. LECTURA (READ)
  // ==========================================

  async getAll(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply,
  ) {
    const { page = 1, limit = 10, isTrash = false, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = request.query as any;

    const result = await this.service.findManyWithCount({
      where: this.service.getAuditWhere(isTrash === 'true' || isTrash === true, filters),
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { [sortBy]: sortOrder },
    });

    return reply.send({
      data: result.data,
      meta: {
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(result.total / Number(limit)),
      },
    });
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const record = await this.service.findFirst({ where: { id } });

    if (!record) {
      throw new HttpError(404, 'Registro no encontrado');
    }

    return reply.send(record);
  }

  // ==========================================
  // 2. ESCRITURA (WRITE)
  // ==========================================

  async create(
    request: FastifyRequest<{ Body: any }>,
    reply: FastifyReply,
  ) {
    const userId = (request.session as any)?.user?.id;
    // Extraer ownership fields si vienen en el body o inyectarlos desde la sesión
    const data = {
      ...request.body,
      ownerId: request.body.ownerId || userId,
      ownerTeamId: request.body.ownerTeamId,
      ownerOrganizationId: request.body.ownerOrganizationId,
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

    const record = await this.service.update(id, request.body, userId);
    return reply.send(record);
  }

  // ==========================================
  // 3. ESTADOS Y BORRADO (SOFT DELETE / RESTORE)
  // ==========================================

  async softDelete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const userId = (request.session as any)?.user?.id;

    const record = await this.service.softDelete(id, userId);
    return reply.send(record);
  }

  async restore(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const userId = (request.session as any)?.user?.id;

    const record = await this.service.restore(id, userId);
    return reply.send(record);
  }

  async deletePermanent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    await this.service.hardDeleteManyWithContext({ id });
    return reply.code(204).send();
  }
}
