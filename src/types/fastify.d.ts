import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import type { PermissionAction } from '@prisma/client';
import type { Auth } from 'better-auth';

import type { MemberContext } from '@/modules/rbac/rbac.interfaces.js';
import type { RateLimitTiers } from '@/plugins/02.security.js';

type BetterAuthInstance = Auth;

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    s3: S3Client;
    rateLimitTiers: RateLimitTiers;
    auth: BetterAuthInstance;
  }

  interface FastifyRequest {
    session: Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>;
    memberContext: MemberContext | null;
  }

  interface FastifyContextConfig {
    rbac?: {
      resource: string;
      action: PermissionAction;
    };
  }
}
