import type { PermissionAction } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { requirePermission } from './rbac.js';

export function requireEntityPermission(action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { entityType } = request.params as { entityType?: string };
    console.log('Entidad', entityType);

    if (!entityType) {
      return reply.status(400).send({ error: 'entityType requerido' });
    }

    return requirePermission(entityType, action)(request, reply);
  };
}
