import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number(),
  HOST: z.string(),
  API_PREFIX: z.string(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  BACKEND_URL: z.string(),
  FRONTEND_URL: z.string(),
  FRONTEND_URL_WWW: z.string(),

  // Base de Datos
  DATABASE_URL: z.string(),

  // Auth
  BETTER_AUTH_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  // Email
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string(),
  DEV_EMAIL: z.string(),

  // Redis / Valkey
  VALKEY_URL: z.url(),

  //Storage
  S3_ENDPOINT: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_REGION: z.string().default('auto'),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // Swagger
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;
export type AppConfig = z.infer<typeof envSchema>;
