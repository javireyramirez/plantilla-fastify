import type { FastifyInstance } from 'fastify';

type AuthService = FastifyInstance['authService'];

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async handleLoginLog(context: any) {
    let email = 'unknown';
    try {
      email = context.body?.email || context.context?.returned?.user?.email || 'unknown';
    } catch {
      // no se pudo leer el email
    }

    const headers = context.request.headers;
    const ipAddress =
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      'unknown';

    const userAgent = headers.get('user-agent') || 'unknown';
    const isSuccess = !!(context.context?.returned?.user && context.context?.returned?.token);

    await this.authService.logLoginAttempt({
      email,
      success: isSuccess,
      ipAddress,
      userAgent,
      failReason: isSuccess ? null : 'Invalid credentials',
    });
  }

  async handleLogoutLog(context: any) {
    const headers = context.request.headers;
    const ipAddress =
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      'unknown';

    const userAgent = headers.get('user-agent') || 'unknown';

    let session: any = null;
    try {
      session = await context.context.getSession({
        headers: context.request.headers,
      });
    } catch (error) {
      console.error('Error al obtener sesión en handleLogoutLog:', error);
    }

    if (session?.user) {
      await this.authService.logLogout({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        ipAddress,
        userAgent,
      });
    }
  }
}
