import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import type { PermissionAction } from '@prisma/client';
import type { PermissionAction, PermissionScope } from '@prisma/client';
import type { Auth } from 'better-auth';

import type { AuthInstance } from '@/config/auth/auth.js';
import type { UserContext } from '@/modules/rbac/rbac.interfaces.js';
import type { RateLimitTiers } from '@/plugins/02.security.js';
import type { AppSession } from '@/types/auth.types.js';

type BetterAuthInstance = Auth;

// src/types/auth.types.ts
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSession {
  user: SessionUser;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    s3: S3Client;
    rateLimitTiers: RateLimitTiers;
    auth: AuthInstance;
  }

  interface FastifyRequest {
    session: AppSession | null;
    userContext: UserContext | null;
    permissions?: {
      module: string;
      action: PermissionAction;
      scope: PermissionScope;
    };
  }

  interface FastifyContextConfig {
    rbac?: {
      resource: string;
      action: PermissionAction;
    };
  }
}
