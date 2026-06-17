import type { ScopeContext } from '@/types/base.types.js';

export function buildScopeFilter(ctx: ScopeContext, modelName?: string): Record<string, any> {
  const ownershipModels = ['company', 'document'];
  if (modelName && !ownershipModels.includes(modelName.toLowerCase())) {
    return {};
  }

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
              teamMember: {
                some: { teamId: teamsFilter },
              },
            },
          },

          {
            creator: {
              teamMember: {
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
