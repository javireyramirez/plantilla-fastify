// hooks/member.context.ts
import { FastifyReply, FastifyRequest } from 'fastify';

export async function memberContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.session?.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const organizationId =
    (request.headers['x-organization-id'] as string | undefined) ??
    (request.params as any)?.organizationId;

  // Si no viene en el header/params, resolvemos la membresía activa del usuario
  if (!organizationId) {
    const defaultMembership = await request.server.prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        organization: { select: { id: true, slug: true, name: true, status: true } },
        teamMembers: { select: { teamId: true } },
      },
      orderBy: {
        // si tienes byDefault en org puedes priorizar con un join;
        // de lo contrario, toma la más reciente
        joinedAt: 'asc',
      },
    });

    if (!defaultMembership) {
      return reply.status(403).send({ error: 'Not a member of any organization' });
    }
    if (!defaultMembership.isActive) {
      return reply.status(403).send({ error: 'Membership is inactive' });
    }
    if (defaultMembership.organization.status !== 'ACTIVE') {
      return reply.status(403).send({ error: 'Organization is not active' });
    }

    request.memberContext = {
      organizationId: defaultMembership.organizationId,
      organization: defaultMembership.organization,
      memberId: defaultMembership.id,
      teamIds: defaultMembership.teamMembers.map((tm) => tm.teamId),
    };
    return;
  }

  // Flujo normal cuando sí viene organizationId
  const membership = await request.server.prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    include: {
      organization: { select: { id: true, slug: true, name: true, status: true } },
      teamMembers: { select: { teamId: true } },
    },
  });

  if (!membership) return reply.status(403).send({ error: 'Not a member of this organization' });
  if (!membership.isActive) return reply.status(403).send({ error: 'Membership is inactive' });
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
