import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkMemberIdsBodySchema,
  BulkToggleMemberStatusSchema,
  CreateMemberSchema,
  GetMembersQuery,
  Organization,
  ToggleMemberStatusSchema,
} from './organization.schema.js';
import { OrganizationService } from './organization.service.js';

export class OrganizationController extends BaseController<Organization> {
  constructor(private readonly organizationService: OrganizationService) {
    super(organizationService);
  }

  // ==========================================
  // LECTURA
  // ==========================================

  async getAllMembers(
    request: FastifyRequest<{ Params: { id: string }; Querystring: GetMembersQuery }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { page, limit, sortBy, sortOrder, isActive, ...filters } = request.query;
    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.organizationService.getMembersWithCount(
      id,
      { skip, take, orderBy, isActive, ...filters },
      request.memberContext,
    );

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // OPERACIONES INDIVIDUALES
  // ==========================================

  async addMember(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const invitedBy = request.session?.user?.id;
    const body = CreateMemberSchema.parse(request.body);

    const record = await this.organizationService.addMember(
      id,
      body,
      invitedBy,
      request.memberContext,
    );
    return reply.code(201).send(record);
  }

  async removeMember(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply,
  ) {
    const { id, userId } = request.params;

    const record = await this.organizationService.removeMember(id, userId, request.memberContext);
    return reply.send(record);
  }

  async toggleMemberStatus(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply,
  ) {
    const { id, userId } = request.params;
    const { isActive } = ToggleMemberStatusSchema.parse(request.body);

    const record = await this.organizationService.toggleMemberStatus(
      id,
      userId,
      isActive,
      request.memberContext,
    );
    return reply.send(record);
  }

  // ==========================================
  // BULK
  // ==========================================

  async addMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const invitedBy = request.session?.user?.id;
    const { userIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.organizationService.addMembers(
      id,
      userIds,
      invitedBy,
      request.memberContext,
    );
    return reply.code(201).send(record);
  }

  async removeMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const { userIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.organizationService.removeMembers(id, userIds, request.memberContext);
    return reply.send(record);
  }

  async toggleMembersStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { userIds, isActive } = BulkToggleMemberStatusSchema.parse(request.body);

    const record = await this.organizationService.toggleMembersStatus(
      id,
      userIds,
      isActive,
      request.memberContext,
    );
    return reply.send(record);
  }
}
