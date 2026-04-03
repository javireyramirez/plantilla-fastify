import type { FastifyReply, FastifyRequest } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const session = await request.server.auth.api.getSession({
    headers: request.headers as any,
  });

  if (!session) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Valid session required',
    });
  }

  request.session = session;
}
