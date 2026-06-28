import type { FastifyReply, FastifyRequest } from 'fastify';
import { requireScope } from '@/utils/scope.js';
import { parsePagination } from '@/utils/pagination.js';
import { GetTrashQuerySchema } from './trash.schema.js';
import type { TrashService } from './trash.service.js';

export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  async getTrash(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply,
  ) {
    const session = request.session;
    if (!session?.user) {
      return reply.status(401).send({ error: 'No autorizado' });
    }

    const { page, limit, search, category, sortBy, sortOrder } = GetTrashQuerySchema.parse(request.query);

    const userContext = request.userContext ?? { teamIds: [] };

    const result = await this.trashService.getAuthorizedTrash({
      userId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
      teamIds: userContext.teamIds,
      category,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(result.total / limit);

    return reply.send({
      data: result.data,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    });
  }

  async restore(
    request: FastifyRequest<{ Params: { moduleSlug: string; id: string } }>,
    reply: FastifyReply,
  ) {
    const session = request.session;
    if (!session?.user) {
      return reply.status(401).send({ error: 'No autorizado' });
    }

    const { moduleSlug, id } = request.params;
    const scope = requireScope(request);

    await this.trashService.restore(moduleSlug, id, session.user.id, scope);
    return reply.code(200).send({ success: true, message: 'Registro restaurado correctamente' });
  }

  async purge(
    request: FastifyRequest<{ Params: { moduleSlug: string; id: string } }>,
    reply: FastifyReply,
  ) {
    const session = request.session;
    if (!session?.user) {
      return reply.status(401).send({ error: 'No autorizado' });
    }

    const { moduleSlug, id } = request.params;
    const scope = requireScope(request);

    await this.trashService.purge(moduleSlug, id, session.user.id, scope);
    return reply.code(200).send({ success: true, message: 'Registro purgado permanentemente' });
  }

  async triggerCleanup(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const session = request.session;
    if (!session?.user?.isSuperAdmin) {
      return reply.status(403).send({ error: 'Prohibido: Se requieren permisos de administrador' });
    }

    const result = await this.trashService.emptyExpiredTrash();
    return reply.send({ success: true, message: 'Limpieza completada', ...result });
  }
}
