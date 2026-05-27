import type { FastifyRequest } from 'fastify';

import type { ScopeContext } from '@/repositories/base.repository.js';
import { HttpError } from '@/utils/http.error.js';

export function scopeFromRequest(request: FastifyRequest): ScopeContext | undefined {
  const { permissions, memberContext, session } = request;
  if (!permissions || !memberContext || !session?.user) return undefined;

  return {
    scope: permissions.scope,
    userId: session.user.id,
    organizationId: memberContext.organizationId,
    teamIds: memberContext.teamIds,
  };
}

export function requireScope(request: FastifyRequest): ScopeContext {
  const scope = scopeFromRequest(request);
  if (!scope) throw new HttpError(403, 'Forbidden');
  return scope;
}
