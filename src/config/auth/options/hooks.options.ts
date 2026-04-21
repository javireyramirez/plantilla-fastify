import { createAuthMiddleware } from 'better-auth/api';

import { AuthController } from '@/modules/auth/auth.controller.js';
import type { AuthService } from '@/modules/auth/auth.service.js';

export const createHooksAuth = (authService: AuthService) => ({
  after: createAuthMiddleware(async (ctx) => {
    if (ctx.path.startsWith('/sign-in')) {
      try {
        const controller = new AuthController(authService);
        await controller.handleLoginLog(ctx);
      } catch (error) {
        console.error('Error auditoria login:', error);
      }
    }
  }),
});
