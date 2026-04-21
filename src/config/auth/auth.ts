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
    basePath: `auth`,

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

    plugins: [openAPI()],

    baseURL: env.BACKEND_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.FRONTEND_URL, env.FRONTEND_URL_WWW, env.BACKEND_URL],

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
      },
    },

    advanced: {
      crossSubdomain: {
        enabled: true,
      },
      useSecureCookies: isProd,
      generateSessionToken: true,
      cookies: {
        session_token: {
          name: 'better-auth.session_token',
          attributes: {
            sameSite: 'none',
            secure: isProd,
            httpOnly: true,
            path: '/',
            domain: undefined,
          },
        },
        state: {
          name: 'better-auth.state',
          attributes: {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
            path: '/',
            maxAge: 60 * 10,
          },
        },
        pkce_code_verifier: {
          name: 'better-auth.pkce_code_verifier',
          attributes: {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
            path: '/',
            maxAge: 60 * 10,
          },
        },
        session_data: {
          name: 'better-auth.session_data',
          attributes: {
            sameSite: 'none',
            secure: true,
            httpOnly: false,
            path: '/',
            domain: undefined,
          },
        },
        dont_remember: {
          name: 'better-auth.dont_remember',
          attributes: {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
            path: '/',
            domain: undefined,
          },
        },
      },
    },
  });
