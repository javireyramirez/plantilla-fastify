import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

interface SecurityEvent {
  event: 'cors_blocked' | 'rate_limit_hit' | 'suspicious_origin';
  origin?: string;
  ip?: string;
  path?: string;
  tier?: RateLimitTierKey;
  timestamp: string;
}

export const RATE_LIMIT_TIERS = {
  auth: { max: 5, timeWindow: '1 minute' },
  api: { max: 200, timeWindow: '1 minute' },
  public: { max: 60, timeWindow: '1 minute' },
  webhook: { max: 500, timeWindow: '1 minute' },
} as const;

export type RateLimitTier = typeof RATE_LIMIT_TIERS;
export type RateLimitTierKey = keyof typeof RATE_LIMIT_TIERS;

export default fp(async (fastify: FastifyInstance) => {
  const INTERNAL_IPS = ['127.0.0.1', '::1', ...(fastify.config.INTERNAL_IPS?.split(',') ?? [])];

  function buildAllowedOrigins(): Set<string> {
    const origins = new Set<string>();

    if (fastify.config.FRONTEND_URL) origins.add(fastify.config.FRONTEND_URL);
    if (fastify.config.FRONTEND_URL_WWW) origins.add(fastify.config.FRONTEND_URL_WWW);
    if (fastify.config.BACKEND_URL) origins.add(fastify.config.BACKEND_URL);

    fastify.config.ALLOWED_ORIGINS?.split(',').forEach((o) => origins.add(o.trim()));

    return origins;
  }

  function logSecurityEvent(fastify: FastifyInstance, event: SecurityEvent): void {
    fastify.log.warn({ security: true, ...event }, `[SECURITY] ${event.event}`);
  }

  function detectRateLimitTier(request: FastifyRequest): RateLimitTierKey {
    const path = request.url;
    if (path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register'))
      return 'auth';
    if (path.startsWith('/webhooks')) return 'webhook';
    if (path.startsWith('/api')) return 'api';
    return 'public';
  }

  fastify.decorate('rateLimitTiers', RATE_LIMIT_TIERS);

  await fastify.register(helmet, {
    global: true,
    contentSecurityPolicy:
      fastify.config.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", fastify.config.CDN_URL ?? ''].filter(Boolean),
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:', fastify.config.CDN_URL ?? ''].filter(Boolean),
              connectSrc: ["'self'", fastify.config.API_URL ?? ''].filter(Boolean),
              fontSrc: ["'self'", fastify.config.CDN_URL ?? ''].filter(Boolean),
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
    crossOriginEmbedderPolicy: fastify.config.NODE_ENV === 'production',
    hsts:
      fastify.config.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  });

  const allowedOrigins = buildAllowedOrigins();

  if (fastify.config.NODE_ENV === 'development') {
    fastify.log.warn(
      { origins: [...allowedOrigins] },
      '[SECURITY] CORS en modo desarrollo — revisa orígenes permitidos',
    );
  }

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      try {
        const parsedOrigin = new URL(origin);
        if (fastify.config.NODE_ENV === 'development' && parsedOrigin.hostname === 'localhost') {
          return cb(null, true);
        }
      } catch {
        // Ignorar URLs malformadas
      }

      logSecurityEvent(fastify, {
        event: 'cors_blocked',
        origin,
        timestamp: new Date().toISOString(),
      });

      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Request-ID'],
    exposedHeaders: ['Set-Cookie', 'X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });

  await fastify.register(rateLimit, {
    global: true,
    max: (request) => {
      const tier = detectRateLimitTier(request);
      return RATE_LIMIT_TIERS[tier].max;
    },
    timeWindow: 60000,
    allowList: (request) => {
      const ip = request.ip;
      const path = request.url;
      return INTERNAL_IPS.includes(ip) || path === '/health' || path === '/ready';
    },
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      logSecurityEvent(fastify, {
        event: 'rate_limit_hit',
        ip: request.ip,
        path: request.url,
        tier: detectRateLimitTier(request),
        timestamp: new Date().toISOString(),
      });

      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Límite de ${context.max} peticiones por minuto alcanzado. Reintentar en ${Math.ceil(context.ttl / 1000)}s.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  fastify.log.info(
    { allowedOrigins: [...allowedOrigins] },
    'Plugin de seguridad registrado (Helmet, CORS, Rate-Limit)',
  );
});
