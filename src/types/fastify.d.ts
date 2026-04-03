import { S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

// Importa tus clases aquí
// import { AuthService } from '../modules/auth/auth.service';
// import { OrdersService } from '../modules/orders/orders.service';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    s3: S3Client;
    // services: {
    //   auth: AuthService;
    //   orders: OrdersService;
    // };
  }
}
