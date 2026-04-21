import { Button, Heading, Section, Text } from '@react-email/components';

import * as React from 'react';

import { EmailLayout } from '../../components/layout.js';

interface ResetPasswordEmailProps {
  resetPasswordUrl: string;
  userName?: string;
  expiration?: string;
}

export function ResetPasswordTemplate({
  resetPasswordUrl,
  userName = 'Usuario',
  expiration = '1 hora',
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout previewText="Verifica tu cuenta">
      <Section>
        <Text className="text-2xl font-bold text-foreground">Recuperación de contraseña</Text>
        <Heading className="text-2xl font-bold text-gray-900 mb-4">¡Hola {userName}!</Heading>
        <Text className="text-muted-foreground">
          Recibimos una solicitud para restablecer tu contraseña.
        </Text>
        <Button
          className="bg-brand text-white px-6 py-3 rounded-brand font-medium"
          href={resetPasswordUrl}
        >
          Restablecer contraseña
        </Button>
        <Text className="text-muted-foreground">Este enlace expirará en {expiration}.</Text>
        <Text className="text-muted-foreground">
          Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
        </Text>
      </Section>
    </EmailLayout>
  );
}
