import type { JSX } from 'react';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: JSX.Element; // o el tipo que use @repo/emails
  type: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateLogOptions {
  recipient: string;
  subject: string;
  html: string;
  type: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendWithProviderOptions {
  recipient: string;
  subject: string;
  html: string;
  logId?: string;
  userId?: string;
}
