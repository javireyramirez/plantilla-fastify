import type { PermissionAction, PermissionScope } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { HttpError } from '@/utils/http.error.js';

const SCOPE_PRIORITY: Record<PermissionScope, number> = {
  GLOBAL: 3,
  TEAM: 2,
  OWN: 1,
};

function mostPermissive(scopes: PermissionScope[]): PermissionScope {
  return scopes.reduce((best, current) =>
    SCOPE_PRIORITY[current] > SCOPE_PRIORITY[best] ? current : best,
  );
}

export function requirePermission(resource: string, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const session = request.session;
    const ctx = request.memberContext;

    if (session.user.isSuperAdmin) {
      request.permissions = {
        module: resource,
        action,
        scope: 'GLOBAL',
      };
      return;
    }

    const { teamIds = [] } = ctx || {};
    const userId = session.user.id;

    const assignments = await request.server.prisma.roleAssignment.findMany({
      where: {
        OR: [{ userId }, ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : [])],
      },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                module: { slug: resource },
                action,
              },
            },
          },
        },
      },
    });

    const scopes = assignments.flatMap((a) => a.role.permissions).map((p) => p.scope);

    if (scopes.length === 0) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    request.permissions = {
      module: resource,
      action,
      scope: mostPermissive(scopes),
    };
  };
}
