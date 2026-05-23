import { FastifyRequest } from 'fastify';

import { HttpError } from '@/utils/http.error.js';

// hooks/rbac.hook.ts — ahora trivial
export async function rbacHook(request: FastifyRequest) {
  const rbac = request.routeOptions.config.rbac;
  if (!rbac) return;

  if (!request.memberContext) throw new HttpError(403, 'Sin contexto de acceso');

  const key = `${rbac.resource}:${rbac.action}`;
  if (!request.memberContext.permissions.has(key)) {
    throw new HttpError(403, 'No tienes permisos para esta acción');
  }
}
