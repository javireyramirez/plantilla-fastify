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
      // Intentar buscar el usuario por email para asociar su ID al log de auditoría
      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true, name: true },
      });

      await this.prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: 'LOGIN',
          displayName: user ? user.name || data.email : data.email,
          description: data.success
            ? 'Inicio de sesión correcto'
            : `Intento de inicio de sesión fallido: ${data.failReason || 'Credenciales inválidas'}`,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: {
            email: data.email,
            success: data.success,
            failReason: data.failReason || null,
          },
        },
      });
    } catch (error) {
      this.log.error(
        {
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'Error en el log de login',
      );
    }
  }

  async logLogout(data: {
    userId: string;
    email: string;
    name?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: 'LOGOUT',
          displayName: data.name || data.email,
          description: 'Cierre de sesión correcto',
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: {
            email: data.email,
          },
        },
      });
    } catch (error) {
      this.log.error(
        {
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'Error en el log de logout',
      );
    }
  }
}
export type { AuthService as AuthType };
