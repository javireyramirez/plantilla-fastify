import { ResetPasswordTemplate } from '../src/templates/auth/reset-password-email.js';

// Este archivo es solo para preview en React Email
export default function ResetPasswordEmail() {
  return (
    <ResetPasswordTemplate
      userName="Juan Pérez"
      resetPasswordUrl="https://tu-app.com/verify?token=abc123"
      expiration="1 hora"
    />
  );
}
