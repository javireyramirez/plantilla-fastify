import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import type { Auth, BetterAuthOptions } from 'better-auth';

import type { RateLimitTier } from '@/plugins/02.security.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    s3: S3Client;
    rateLimitTiers: RateLimitTiers;
    auth: BetterAuthInstance;
  }

  interface FastifyRequest {
    session: Awaited<ReturnType<BetterAuthInstance['api']['getSession']>>;
  }
}
