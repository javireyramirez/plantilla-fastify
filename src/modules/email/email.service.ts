import type { FastifyInstance } from 'fastify';

import { render } from '@repo/emails';

import { env } from '@/config/env.js';

import { EmailProvider } from './email.provider.js';
import type { CreateLogOptions, SendEmailOptions, SendWithProviderOptions } from './email.types.js';

type Prisma = FastifyInstance['prisma'];
type Logger = FastifyInstance['log'];

const isDevelopment = env.NODE_ENV === 'development';

export class EmailService {
  constructor(
    private readonly prisma: Prisma,
    private readonly log: Logger,
  ) {}

  async send({ to, subject, template, type, userId, metadata }: SendEmailOptions) {
    const html = await render(template);
    const recipient = isDevelopment ? env.DEV_EMAIL : to;
    const finalSubject = isDevelopment ? `[DEV] ${subject}` : subject;

    if (isDevelopment) {
      this.log.warn({ original: to, target: recipient }, 'Email interceptado en desarrollo');
    }

    const logId = await this.createLog({
      recipient,
      subject: finalSubject,
      html,
      type,
      userId,
      metadata,
    });

    return this.sendWithProvider({ recipient, subject: finalSubject, html, logId, userId });
  }

  private async createLog({
    recipient,
    subject,
    html,
    type,
    userId,
    metadata,
  }: CreateLogOptions): Promise<string | undefined> {
    try {
      const log = await this.prisma.emailLog.create({
        data: {
          userId,
          recipient,
          subject,
          body: html,
          type,
          status: 'PENDING',
          metadata: (metadata ?? {}) as any,
        },
      });
      return log.id;
    } catch (err) {
      this.log.error({ err }, 'No se pudo crear el log de email');
      return undefined;
    }
  }

  private async sendWithProvider({
    recipient,
    subject,
    html,
    logId,
    userId,
  }: SendWithProviderOptions) {
    try {
      const { data, error } = await EmailProvider.client.emails.send({
        from: env.EMAIL_FROM,
        to: recipient,
        subject,
        html,
      });

      if (error) throw error;

      if (logId) {
        await this.prisma.emailLog.update({
          where: { id: logId },
          data: { status: 'SENT', providerId: data?.id, sentAt: new Date() },
        });
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.log.error({ err, userId }, 'Fallo crítico en envío de email');

      if (logId) {
        await this.prisma.emailLog
          .update({ where: { id: logId }, data: { status: 'FAILED', error: message } })
          .catch((e) => this.log.error({ err: e }, 'No se pudo marcar el log como fallido'));
      }

      throw err;
    }
  }
}
