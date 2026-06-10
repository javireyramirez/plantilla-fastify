import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateSchema } from '@/schemas/base.schema.js';

import { BaseController } from './base.controller.js';

export abstract class OwnedController<T> extends BaseController<T> {
  override async create(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    const userId = this.getUserId(request);
    const { organizationId } = request.memberContext ?? {};

    const body = CreateSchema.parse(request.body);

    const data = {
      ...body,
      ownerId: body.ownerId ?? userId,
      ownerOrganizationId: body.ownerOrganizationId ?? organizationId,
    };

    const record = await this.service.create(data, { userId });
    return reply.code(201).send(record);
  }
}
