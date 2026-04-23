import { z } from 'zod';

export const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number(),
  HOST: z.string(),
  API_PREFIX: z.string(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  ALLOWED_ORIGINS: z.string().optional(), // "https://app.com,https://admin.com"
  INTERNAL_IPS: z.string().optional(), // "10.0.0.1,10.0.0.2"
  CDN_URL: z.url().optional(),
  API_URL: z.url().optional(),
  CSP_REPORT_URI: z.url().optional(),

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

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // Swagger
  SWAGGER_ENABLED: z.coerce.boolean().default(false),
});

const s3Schema = baseSchema.extend({
  STORAGE_PROVIDER: z.literal('s3'),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default('auto'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
});

const gcsSchema = baseSchema.extend({
  STORAGE_PROVIDER: z.literal('gcs'),
  GCS_BUCKET: z.string().min(1),
  GCS_KEY_FILE: z.string().min(1),
});

const localSchema = baseSchema.extend({
  STORAGE_PROVIDER: z.literal('local'),
  LOCAL_STORAGE_PATH: z.string().min(1),
});

export const envSchema = z.discriminatedUnion('STORAGE_PROVIDER', [
  s3Schema,
  gcsSchema,
  localSchema,
]);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;
export type AppConfig = z.infer<typeof envSchema>;
