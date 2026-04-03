import * as React from 'react';

import { ResetPasswordTemplate, VerificationTemplate } from '@repo/emails';

import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { EmailService } from '@/modules/email/email.service.js';

// Sin fastify.log, usamos console como fallback fuera de Fastify
const emailService = new EmailService(prisma, console as any);

export const emailOptions = {
  sendResetPassword: async ({ user, token }: any) => {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await emailService.send({
      to: user.email,
      userId: user.id,
      subject: 'Recupera tu contraseña',
      type: 'PASSWORD_RESET',
      metadata: { resetUrl },
      template: React.createElement(ResetPasswordTemplate, {
        userName: user.name ?? 'Usuario',
        resetPasswordUrl: resetUrl,
        expiration: '1 hora',
      }),
    });
  },
};

export const emailVerification = {
  sendVerificationEmail: async ({ user, token }: any) => {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await emailService.send({
      to: user.email,
      userId: user.id,
      subject: 'Verifica tu email',
      type: 'EMAIL_VERIFICATION',
      metadata: { verificationUrl },
      template: React.createElement(VerificationTemplate, {
        userName: user.name ?? 'Usuario',
        verificationUrl: verificationUrl,
        expiration: '24 horas',
      }),
    });
  },
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60 * 24,
};
