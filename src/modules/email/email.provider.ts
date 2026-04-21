import { Resend } from 'resend';

import { env } from '@/config/env.js';

export const resend = new Resend(env.RESEND_API_KEY);

export class EmailProvider {
  static client = resend;

  static async verifyConnection() {
    try {
      const { data, error } = await resend.domains.list();
      return !error;
    } catch {
      return false;
    }
  }
}
