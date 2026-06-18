import { FastifyReply, FastifyRequest } from 'fastify';

export async function userContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.session?.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  if (user.isSuperAdmin) {
    request.userContext = {
      teamIds: [],
    };
    return;
  }

  const teamUserships = await request.server.prisma.teamUser.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      teamId: true,
    },
  });

  request.userContext = {
    teamIds: teamUserships.map((tm) => tm.teamId),
  };
}
