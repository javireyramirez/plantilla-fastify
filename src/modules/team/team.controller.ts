import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkMemberIdsBodySchema,
  CreateTeamMemberSchema,
  GetTeamMembersQuery,
  Team,
} from './team.schema.js';
import { TeamService } from './team.service.js';

export class TeamController extends BaseController<Team> {
  constructor(private readonly teamService: TeamService) {
    super(teamService);
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getAllMembers(
    request: FastifyRequest<{ Params: { id: string }; Querystring: GetTeamMembersQuery }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { page, limit, sortBy, sortOrder, ...filters } = request.query;
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

  async addMember(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const invitedBy = (request.session as any)?.user?.id;
    const { id } = request.params;
    const { memberId } = CreateTeamMemberSchema.parse(request.body);

    const record = await this.teamService.addMember(id, memberId, invitedBy);
    return reply.code(201).send(record);
  }

  async removeMember(
    request: FastifyRequest<{ Params: { id: string; memberId: string } }>,
    reply: FastifyReply,
  ) {
    const { id, memberId } = request.params;

    const record = await this.teamService.removeMember(id, memberId);
    return reply.send(record);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async addMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const invitedBy = (request.session as any)?.user?.id;
    const { id } = request.params;
    const { memberIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.teamService.addMembers(id, memberIds, invitedBy);
    return reply.code(201).send(record);
  }

  async removeMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const { memberIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.teamService.removeMembers(id, memberIds);
    return reply.send(record);
  }
}
