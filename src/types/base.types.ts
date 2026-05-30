import { PermissionScope } from '@prisma/client';

export interface ScopeContext {
  scope: PermissionScope;
  userId: string;
  organizationId?: string;
  organizationIds?: string[];
  teamIds: string[];
}

export interface WriteOptions {
  userId?: string;
  scope?: ScopeContext;
  organizationId?: string;
  include?: any;
  select?: any;
}
