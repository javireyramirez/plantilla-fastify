import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import { BulkMemberIdsBodySchema, CreateTeamMemberSchema } from './team.schema.js';
import { TeamService } from './team.service.js';

export class TeamController extends BaseController<any> {
  constructor(private readonly teamService: TeamService) {
    super(teamService);
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getAllMembers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query as any;

    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.teamService.getMembersWithCount(id, {
      skip,
      take,
      orderBy,
      ...filters,
    });

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // 2. OPERACIONES INDIVIDUALES
  // ==========================================

  async addMember(request: FastifyRequest, reply: FastifyReply) {
    const invitedBy = (request as any).session?.user?.id;
    const { id } = request.params as any;
    const { memberId } = CreateTeamMemberSchema.parse(request.body);

    const record = await this.teamService.addMember(id, memberId, invitedBy);
    return reply.code(201).send(record);
  }

  async removeMember(request: FastifyRequest, reply: FastifyReply) {
    const { id, memberId } = request.params as any;

    const record = await this.teamService.removeMember(id, memberId);
    return reply.send(record);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async addMembers(request: FastifyRequest, reply: FastifyReply) {
    const invitedBy = (request as any).session?.user?.id;
    const { id } = request.params as any;
    const { memberIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.teamService.addMembers(id, memberIds, invitedBy);
    return reply.code(201).send(record);
  }

  async removeMembers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { memberIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.teamService.removeMembers(id, memberIds);
    return reply.send(record);
  }
}
