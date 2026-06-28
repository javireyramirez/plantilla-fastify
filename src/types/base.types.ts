import { PermissionScope } from '@prisma/client';

export interface ScopeContext {
  scope: PermissionScope;
  userId: string;
  teamIds: string[];
}

export interface WriteOptions {
  userId?: string;
  scope?: ScopeContext;
  include?: any;
  select?: any;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}


