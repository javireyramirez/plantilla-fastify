import { FastifyReply, FastifyRequest } from 'fastify';

export const authBridge = (betterAuthHandler: any) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Inyectamos el body si existe
    if (request.body) {
      (request.raw as any).body = request.body;
    }

    return betterAuthHandler(request.raw, reply.raw);
  };
};
