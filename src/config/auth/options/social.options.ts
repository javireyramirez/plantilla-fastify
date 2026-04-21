import { BetterAuthOptions } from 'better-auth';

import { env } from '@/config/env.js';

export const socialProviders: BetterAuthOptions['socialProviders'] = {
  google: {
    prompt: 'select_account',
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
};
