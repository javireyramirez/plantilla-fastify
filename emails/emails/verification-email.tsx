import { VerificationTemplate } from '../src/templates/auth/verification-email.js';

// Este archivo es solo para preview en React Email
export default function VerificationEmail() {
  return (
    <VerificationTemplate
      userName="Juan Pérez"
      verificationUrl="https://tu-app.com/verify?token=abc123"
    />
  );
}
