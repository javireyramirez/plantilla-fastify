import { FastifyReply, FastifyRequest } from 'fastify';

export async function memberContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.session?.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  if (user.isSuperAdmin) return;

  const rawIds = request.headers['x-organization-ids'] as string | undefined;
  const organizationIds = rawIds
    ? rawIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : null;

  const memberships = organizationIds
    ? await request.server.prisma.organizationMember.findMany({
        where: {
          userId: user.id,
          organizationId: { in: organizationIds },
          isActive: true,
          organization: { status: 'ACTIVE' },
        },
        include: {
          organization: { select: { id: true, slug: true, name: true, status: true } },
          teamMembers: { select: { teamId: true } },
        },
      })
    : await request.server.prisma.organizationMember.findMany({
        where: {
          userId: user.id,
          isActive: true,
          organization: { status: 'ACTIVE' },
        },
        include: {
          organization: { select: { id: true, slug: true, name: true, status: true } },
          teamMembers: { select: { teamId: true } },
        },
        orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
        take: 1,
      });

  if (memberships.length === 0) {
    return reply.status(403).send({
      error: organizationIds
        ? 'Not a member of this organization'
        : 'Not a member of any organization',
    });
  }

  if (organizationIds && memberships.length !== organizationIds.length) {
    return reply.status(403).send({ error: 'Not a member of all requested organizations' });
  }

  request.memberContext = {
    organizationIds: memberships.map((m) => m.organizationId),
    organizationId:
      memberships.find((m) => m.isPrimary)?.organizationId ?? memberships[0].organizationId,
    organization: (memberships.find((m) => m.isPrimary) ?? memberships[0]).organization,
    memberId: (memberships.find((m) => m.isPrimary) ?? memberships[0]).id,
    teamIds: memberships.flatMap((m) => m.teamMembers.map((tm) => tm.teamId)),
  };
}
