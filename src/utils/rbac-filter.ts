import type { ScopeContext } from '@/types/base.types.js';

export function buildScopeFilter(ctx: ScopeContext): Record<string, any> {
  switch (ctx.scope) {
    case 'GLOBAL':
      return {};

    case 'OWN':
      return {
        OR: [{ ownerId: ctx.userId }, { createdBy: ctx.userId }],
      };

    case 'TEAM': {
      const teamsFilter = ctx.teamIds && ctx.teamIds.length > 0 ? { in: ctx.teamIds } : { in: [] };
      return {
        OR: [
          {
            owner: {
              teamUser: {
                some: { teamId: teamsFilter },
              },
            },
          },

          {
            creator: {
              teamUser: {
                some: { teamId: teamsFilter },
              },
            },
          },
        ],
      };
    }
    default:
      return {};
  }
}
