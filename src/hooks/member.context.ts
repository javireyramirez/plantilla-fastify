import type { FastifyRequest } from 'fastify';
import { FastifyInstance } from 'fastify';

// hooks/member-context.hook.ts
export async function memberContextHook(request: FastifyRequest, fastify: FastifyInstance) {
  const { orgId, teamId } = request.params as any;
  const userId = request.session.user.id;

  const member = await fastify.organizationService.getMemberContext(orgId, userId);

  // Permisos base del rol en la org
  const permissions = new Set(member.role.permissions.map((p) => `${p.resource}:${p.action}`));

  let team;
  if (teamId) {
    team = await fastify.teamService.getTeamMemberContext(teamId, member.id);
    // Suma los permisos del rol en el team
    team.role.permissions.forEach((p) => {
      permissions.add(`${p.resource}:${p.action}`);
    });
  }

  request.memberContext = { member, team, permissions };
}
