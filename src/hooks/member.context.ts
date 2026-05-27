// hooks/member.context.ts
import { FastifyReply, FastifyRequest } from 'fastify';

export async function memberContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.session?.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const organizationId =
    (request.headers['x-organization-id'] as string) ?? (request.params as any)?.organizationId;

  if (!organizationId) {
    return reply.status(400).send({ error: 'Organization context required' });
  }

  const membership = await request.server.prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId,
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
        },
      },
      teamMembers: {
        select: {
          teamId: true,
        },
      },
    },
  });

  if (!membership) {
    return reply.status(403).send({ error: 'Not a member of this organization' });
  }

  if (!membership.isActive) {
    return reply.status(403).send({ error: 'Membership is inactive' });
  }

  if (membership.organization.status !== 'ACTIVE') {
    return reply.status(403).send({ error: 'Organization is not active' });
  }

  request.memberContext = {
    organizationId,
    organization: membership.organization,
    memberId: membership.id,
    teamIds: membership.teamMembers.map((tm) => tm.teamId),
  };
}
