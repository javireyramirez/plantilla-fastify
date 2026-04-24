import { i18n } from '@better-auth/i18n';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';

import {
  createHooksAuth,
  emailOptions,
  emailVerification,
  socialProviders,
} from '@/config/auth/options/index.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import type { AuthService } from '@/modules/auth/auth.service.js';

const isProd = env.NODE_ENV === 'production';

export const createAuth = (authService: AuthService) =>
  betterAuth({
    basePath: `${env.API_PREFIX}/auth`,

    rateLimit: {
      window: 5,
      max: 60,
      customRules: {
        '/get-session': false,
        '/sign-out/email': false,
      },
    },

    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),

    emailAndPassword: {
      enabled: true,
      ...emailOptions,
    },

    emailVerification: emailVerification,

    socialProviders: socialProviders,

    hooks: createHooksAuth(authService),

    plugins: [
      openAPI(),
      i18n({
        translations: {
          es: {
            USER_NOT_FOUND: 'Usuario no encontrado',
            INVALID_EMAIL_OR_PASSWORD: 'Email o contraseña invalidos',
            INVALID_PASSWORD: 'Contraseña invalidaS',
          },
        },
      }),
    ],

    baseURL: env.BACKEND_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.FRONTEND_URL, env.FRONTEND_URL_WWW, env.BACKEND_URL].filter(Boolean),

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
      },
    },

    advanced: {
      useSecureCookies: isProd,
    },
  });
