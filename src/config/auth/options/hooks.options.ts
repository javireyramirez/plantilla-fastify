import { createAuthMiddleware } from 'better-auth/api';

import { env } from '@/config/env.js';
import { AuthController } from '@/modules/auth/auth.controller.js';

export const hooksAuth = {
  after: createAuthMiddleware(async (ctx) => {
    if (ctx.path.startsWith('/sign-in')) {
      try {
        console.log('Simulacion logs');
        await AuthController.handleLoginLog(ctx);
      } catch (error) {
        console.error('Error auditoria login:', error);
      }
    }
  }),
};
