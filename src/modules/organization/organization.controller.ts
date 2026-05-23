import { FastifyReply, FastifyRequest } from 'fastify';

import { BaseController } from '@/controllers/base.controller.js';
import { parsePagination } from '@/utils/pagination.js';

import {
  BulkCreateMembersSchema,
  BulkMemberIdsBodySchema,
  BulkToggleMemberStatusSchema,
  BulkUpdateMemberRoleSchema,
  CreateMemberSchema,
  GetMembersQuery,
  Organization,
  ToggleMemberStatusSchema,
  UpdateMemberRoleSchema,
} from './organization.schema.js';
import { OrganizationService } from './organization.service.js';

export class OrganizationController extends BaseController<Organization> {
  constructor(private readonly organizationService: OrganizationService) {
    super(organizationService);
  }

  // ==========================================
  // 1. LECTURA
  // ==========================================

  async getAllMembers(
    request: FastifyRequest<{ Params: { id: string }; Querystring: GetMembersQuery }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { page, limit, sortBy, sortOrder, isActive, ...filters } = request.query;
    const { skip, take, orderBy, meta } = parsePagination({ page, limit, sortBy, sortOrder });

    const result = await this.organizationService.getMembersWithCount(id, {
      skip,
      take,
      orderBy,
      isActive, // ya viene como boolean desde el schema con preprocess
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
    const body = CreateMemberSchema.parse(request.body);

    const record = await this.organizationService.addMember(id, body, invitedBy);
    return reply.code(201).send(record);
  }

  async removeMember(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply,
  ) {
    const removedBy = (request.session as any)?.user?.id;
    const { id, userId } = request.params;

    const record = await this.organizationService.removeMember(id, userId, removedBy);
    return reply.send(record);
  }

  async updateMemberRole(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply,
  ) {
    const updatedBy = (request.session as any)?.user?.id;
    const { id, userId } = request.params;
    const { roleId } = UpdateMemberRoleSchema.parse(request.body);

    const record = await this.organizationService.updateMemberRole(id, userId, roleId, updatedBy);
    return reply.send(record);
  }

  async toggleMemberStatus(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply,
  ) {
    const { id, userId } = request.params;
    const { isActive } = ToggleMemberStatusSchema.parse(request.body);

    const record = await this.organizationService.toggleMemberStatus(id, userId, isActive);
    return reply.send(record);
  }

  // ==========================================
  // 3. OPERACIONES MASIVAS (BULK)
  // ==========================================

  async addMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const invitedBy = (request.session as any)?.user?.id;
    const { id } = request.params;
    const body = BulkCreateMembersSchema.parse(request.body);

    const record = await this.organizationService.addMembers(id, body, invitedBy);
    return reply.code(201).send(record);
  }

  async removeMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const removedBy = (request.session as any)?.user?.id;
    const { id } = request.params;
    const { userIds } = BulkMemberIdsBodySchema.parse(request.body);

    const record = await this.organizationService.removeMembers(id, userIds, removedBy);
    return reply.send(record);
  }

  async updateMembersRole(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const updatedBy = (request.session as any)?.user?.id;
    const { id } = request.params;
    const { userIds, roleId } = BulkUpdateMemberRoleSchema.parse(request.body);

    const record = await this.organizationService.updateMembersRole(id, userIds, roleId, updatedBy);
    return reply.send(record);
  }

  async toggleMembersStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { userIds, isActive } = BulkToggleMemberStatusSchema.parse(request.body);

    const record = await this.organizationService.toggleMembersStatus(id, userIds, isActive);
    return reply.send(record);
  }
}
