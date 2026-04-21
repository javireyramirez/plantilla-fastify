import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

import * as React from 'react';

import { LOGO_URL } from '../utils/constants.js';
import { theme } from '../utils/theme.js';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText: string;
}

export const EmailLayout = ({ children, previewText }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: theme.colors,
              borderRadius: {
                brand: theme.radius,
              },
            },
          },
        }}
      >
        <Body className="bg-white font-sans text-[14px]">
          <Container className="mx-auto py-8 px-4 w-[465px]">
            <Section className="mt-8 text-center">
              <Img src={LOGO_URL} alt="Logo" width="150" height="50" className="mx-auto my-0" />
            </Section>
            {children}
            <Section className="mt-8">
              <Hr className="border-gray-300 my-6" />
              <Text className="text-gray-500 text-xs text-center">
                © 2025 Empresa Genérica. Todos los derechos reservados.
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-2">
                <Link href="https://your-domain.com/privacy" className="text-blue-600 underline">
                  Política de Privacidad
                </Link>
                {' • '}
                <Link href="https://your-domain.com/terms" className="text-blue-600 underline">
                  Términos de Servicio
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
