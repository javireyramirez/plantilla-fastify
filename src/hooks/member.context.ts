import { FastifyReply, FastifyRequest } from 'fastify';

export async function memberContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.session?.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const organizationId =
    (request.headers['x-organization-id'] as string | undefined) ??
    (request.params as any)?.organizationId;

  const membership = organizationId
    ? await request.server.prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId } },
        include: {
          organization: { select: { id: true, slug: true, name: true, status: true } },
          teamMembers: { select: { teamId: true } },
        },
      })
    : await request.server.prisma.organizationMember.findFirst({
        where: { userId: user.id, isActive: true },
        include: {
          organization: { select: { id: true, slug: true, name: true, status: true } },
          teamMembers: { select: { teamId: true } },
        },
        orderBy: [{ organization: { byDefault: 'desc' } }, { joinedAt: 'asc' }],
      });

  if (!membership) {
    return reply.status(403).send({
      error: organizationId
        ? 'Not a member of this organization'
        : 'Not a member of any organization',
    });
  }

  if (!membership.isActive) {
    return reply.status(403).send({ error: 'Membership is inactive' });
  }

  if (membership.organization.status !== 'ACTIVE') {
    return reply.status(403).send({ error: 'Organization is not active' });
  }

  request.memberContext = {
    organizationId: membership.organizationId,
    organization: membership.organization,
    memberId: membership.id,
    teamIds: membership.teamMembers.map((tm) => tm.teamId),
  };
}
