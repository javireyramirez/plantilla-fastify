import { FastifyReply, FastifyRequest } from 'fastify';

export async function memberContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.session?.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  if (user.isSuperAdmin) {
    request.memberContext = {
      teamIds: [],
    };
    return;
  }

  const teamMemberships = await request.server.prisma.teamMember.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      teamId: true,
    },
  });

  request.memberContext = {
    teamIds: teamMemberships.map((tm) => tm.teamId),
  };
}
