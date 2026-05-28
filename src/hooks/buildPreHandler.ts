import { PermissionAction } from '@prisma/client';

import { memberContext } from '@/hooks/member.context.js';
import { BaseRoutesOptions } from '@/types/base-routes.types.js';

import { requirePermission } from './rbac.js';
import { requireAuth } from './require.auth.js';

export function buildPreHandler(
  resource: string,
  action: PermissionAction,
  options: BaseRoutesOptions,
) {
  const handlers: any[] = [requireAuth];

  if (!options.auth?.skipMemberContext) {
    handlers.push(memberContext);
  }

  if (!options.auth?.skipPermissions) {
    handlers.push(requirePermission(resource, action));
  }

  return handlers;
}
