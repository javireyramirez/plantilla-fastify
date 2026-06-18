import { PermissionAction } from '@prisma/client';

import { userContext } from '@/hooks/user.context.js';
import { BaseRoutesOptions } from '@/types/base-routes.types.js';

import { requirePermission } from './rbac.js';
import { requireAuth } from './require.auth.js';
import { requireSuperAdmin } from './require.superadmin.js';

export function buildPreHandler(
  resource: string,
  action: PermissionAction,
  options: BaseRoutesOptions,
) {
  const handlers: any[] = [requireAuth];

  if (options.auth?.requireSuperAdmin) {
    handlers.push(requireSuperAdmin);
    return handlers;
  }

  if (!options.auth?.skipUserContext) {
    handlers.push(userContext);
  }

  if (!options.auth?.skipPermissions) {
    handlers.push(requirePermission(resource, action));
  }

  return handlers;
}
