import type { FastifyInstance } from 'fastify';

type Prisma = FastifyInstance['prisma'];
type Logger = FastifyInstance['log'];

export class AuthService {
  constructor(
    private readonly prisma: Prisma,
    private readonly log: Logger,
  ) {}

  async logLoginAttempt(data: {
    email: string;
    success: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
    failReason?: string | null;
  }) {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email: data.email,
          success: data.success,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          failReason: data.failReason,
        },
      });
    } catch (error) {
      this.log.error(
        {
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'Error el el log del loggin',
      );
    }
  }
}
