import type { FastifyRequest } from 'fastify';

import type { ScopeContext } from '@/types/base.types.js';
import { HttpError } from '@/utils/http.error.js';

export function scopeFromRequest(request: FastifyRequest): ScopeContext | undefined {
  const { permissions, memberContext, session } = request;
  if (!permissions || !memberContext || !session?.user) return undefined;

  return {
    scope: permissions.scope,
    userId: session.user.id,
    organizationId: memberContext.organizationId,
    organizationIds: memberContext.organizationIds,
    teamIds: memberContext.teamIds,
  };
}

export function requireScope(request: FastifyRequest): ScopeContext | undefined {
  if (!request.permissions) return undefined;

  return {
    scope: request.permissions.scope,
    userId: request.session?.user?.id,
    organizationId: request.memberContext?.organizationId,
    organizationIds: request.memberContext?.organizationIds,
    teamIds: request.memberContext?.teamIds ?? [],
  };
}
