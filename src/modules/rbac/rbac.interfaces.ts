// modules/rbac/rbac.interfaces.ts
import { PermissionAction, PermissionScope } from '@prisma/client';

export type RoleWithPermissions = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: {
    resource: string;
    action: PermissionAction;
    scope: PermissionScope;
    scopeId: string | null;
  }[];
};

export type MemberContext = {
  member: {
    id: string;
    userId: string;
    organizationId: string;
    isActive: boolean;
    role: RoleWithPermissions;
  };
  team?: {
    id: string;
    memberId: string;
    role: RoleWithPermissions;
  };
  permissions: Set<string>;
};
