import { FastifyReply, FastifyRequest } from 'fastify';

import { OwnedController } from '@/controllers/base-owned.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkMemberIdsBodySchema,
  BulkToggleMemberStatusSchema,
  CreateMemberSchema,
  ToggleMemberStatusSchema,
} from './organization.schema.js';
import { OrganizationService } from './organization.service.js';

export class OrganizationController extends OwnedController<any> {
  constructor(private readonly organizationService: OrganizationService) {
    super(organizationService);
  }

  // ==========================================
  // LECTURA
  // ==========================================

  async getAllMembers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { page, limit, sortBy, sortOrder, isActive, ...filters } = request.query as any;
    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.organizationService.getMembersWithCount(
      id,
      { skip, take, orderBy, isActive, ...filters },
      (request as any).memberContext,
    );

    return reply.send({ data: result.data, meta: meta(result.total) });
  }

  // ==========================================
  // OPERACIONES INDIVIDUALES
  // ==========================================

  async addMember(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const invitedBy = (request as any).session?.user?.id;
    const body = CreateMemberSchema.parse(request.body);

    const record = await this.organizationService.addMember(
      id,
      body,
      invitedBy,
      (request as any).memberContext,
    );
    return reply.code(201).send(record);
  }

  async removeMember(request: FastifyRequest, reply: FastifyReply) {
    const { id, userId } = request.params as any;

    const record = await this.organizationService.removeMember(
      id,
      userId,
      (request as any).memberContext,
    );
    return reply.send(record);
  }

  async toggleMemberStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id, userId } = request.params as any;
    const { isActive } = ToggleMemberStatusSchema.parse(request.body);

    const record = await this.organizationService.toggleMemberStatus(
      id,
      userId,
      isActive,
      (request as any).memberContext,
    );
    return reply.send(record);
  }

  // ==========================================
  // BULK
  // ==========================================

  async addMembers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const invitedBy = (request as any).session?.user?.id;
    const { userIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.organizationService.addMembers(
      id,
      userIds,
      invitedBy,
      (request as any).memberContext,
    );
    return reply.code(201).send(record);
  }

  async removeMembers(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { userIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.organizationService.removeMembers(
      id,
      userIds,
      (request as any).memberContext,
    );
    return reply.send(record);
  }

  async toggleMembersStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { userIds, isActive } = BulkToggleMemberStatusSchema.parse(request.body);

    const record = await this.organizationService.toggleMembersStatus(
      id,
      userIds,
      isActive,
      (request as any).memberContext,
    );
    return reply.send(record);
  }
}
