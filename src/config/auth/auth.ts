import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';

import {
  emailOptions,
  emailVerification,
  hooksAuth,
  socialProviders,
} from '@/config/auth/options/index.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';

export const auth = betterAuth({
  basePath: `${env.API_PREFIX}/auth`,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    ...emailOptions,
  },

  emailVerification: emailVerification,

  socialProviders: socialProviders,

  hooks: hooksAuth,

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
    useSecureCookies: true,
    generateSessionToken: true,
    cookies: {
      session_token: {
        name: 'better-auth.session_token',
        attributes: {
          sameSite: 'none',
          secure: true,
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
