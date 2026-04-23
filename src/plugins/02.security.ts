import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface SecurityEvent {
  event: 'cors_blocked' | 'rate_limit_hit' | 'suspicious_origin';
  origin?: string;
  ip?: string;
  path?: string;
  tier?: RateLimitTierKey;
  timestamp: string;
}

// ─── Configuración por entorno ────────────────────────────────────────────────

export const RATE_LIMIT_TIERS = {
  auth: { max: 5, timeWindow: '1 minute' },
  api: { max: 200, timeWindow: '1 minute' },
  public: { max: 60, timeWindow: '1 minute' },
  webhook: { max: 500, timeWindow: '1 minute' },
} as const;

export type RateLimitTier = typeof RATE_LIMIT_TIERS;
export type RateLimitTierKey = keyof typeof RATE_LIMIT_TIERS;
// ─── Plugin principal ─────────────────────────────────────────────────────────

export default fp(async (fastify: FastifyInstance) => {
  const INTERNAL_IPS = ['127.0.0.1', '::1', ...(fastify.config.INTERNAL_IPS?.split(',') ?? [])];

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function buildAllowedOrigins(): Set<string> {
    const origins = new Set<string>();

    if (fastify.config.FRONTEND_URL) origins.add(fastify.config.FRONTEND_URL);
    if (fastify.config.FRONTEND_URL_WWW) origins.add(fastify.config.FRONTEND_URL_WWW);
    if (fastify.config.BACKEND_URL) origins.add(fastify.config.BACKEND_URL);

    fastify.config.ALLOWED_ORIGINS?.split(',').forEach((o) => origins.add(o.trim()));

    return origins;
  }

  function logSecurityEvent(fastify: FastifyInstance, event: SecurityEvent): void {
    // Estructura compatible con Datadog, Elastic, Loki, etc.
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

  // 1. HELMET — cabeceras HTTP de seguridad
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
              // reportUri: fastify.config.CSP_REPORT_URI, // Para Sentry, Report-URI.com, etc.
            },
          }
        : false,
    // Deshabilita COEP en dev (rompe Swagger, GraphiQL, Vite HMR)
    crossOriginEmbedderPolicy: fastify.config.NODE_ENV === 'production',
    // Fuerza HTTPS — solo en producción
    hsts:
      fastify.config.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  });

  // 2. CORS — control de orígenes
  const allowedOrigins = buildAllowedOrigins();

  if (fastify.config.NODE_ENV === 'development') {
    fastify.log.warn(
      { origins: [...allowedOrigins] },
      '[SECURITY] CORS en modo desarrollo — revisa orígenes permitidos',
    );
  }

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Sin origin: redirects OAuth, curl, server-to-server → permitir siempre
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      if (fastify.config.NODE_ENV === 'development' && new URL(origin).hostname === 'localhost') {
        return cb(null, true);
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
    maxAge: 86400, // Cachea preflight 24h — reduce OPTIONS requests
  });

  // 3. RATE LIMITING — global con configuración base
  await fastify.register(rateLimit, {
    global: true,
    max: RATE_LIMIT_TIERS.public.max,
    timeWindow: RATE_LIMIT_TIERS.public.timeWindow,

    // IPs internas y healthchecks no cuentan
    allowList: (request) => {
      const ip = request.ip;
      const path = request.url;
      return INTERNAL_IPS.includes(ip) || path === '/health' || path === '/ready';
    },

    // Key personalizada para evitar bypass con headers manipulados
    keyGenerator: (request) => {
      // Usa el IP real, no el de proxies sin verificar
      return (request.headers['x-real-ip'] as string) ?? request.ip;
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
