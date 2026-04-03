import { Button, Heading, Section, Text } from '@react-email/components';

import * as React from 'react';

import { EmailLayout } from '../../components/layout.js';

interface VerificationEmailProps {
  verificationUrl: string;
  userName?: string;
  expiration?: string;
}

export function VerificationTemplate({
  verificationUrl,
  userName = 'Usuario',
  expiration = '24 horas',
}: VerificationEmailProps) {
  return (
    <EmailLayout previewText="Verifica tu cuenta">
      <Section>
        <Text className="text-2xl font-bold text-foreground">Verifica tu email</Text>
        <Heading className="text-2xl font-bold text-gray-900 mb-4">¡Hola {userName}!</Heading>
        <Text className="text-muted-foreground">
          Haz clic en el botón de abajo para confirmar tu registro.
        </Text>
        <Button
          className="bg-brand text-white px-6 py-3 rounded-brand font-medium"
          href={verificationUrl}
        >
          Confirmar cuenta
        </Button>
        <Text className="text-muted-foreground">Este enlace expirará en {expiration}.</Text>
      </Section>
    </EmailLayout>
  );
}
