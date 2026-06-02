import { FastifyReply, FastifyRequest } from 'fastify';

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.session?.user?.isSuperAdmin) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}
