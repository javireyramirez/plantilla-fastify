// src/utils/rbac-filter.ts
import type { ScopeContext } from '@/types/base.types.js';

/**
 * Construye el objeto 'where' de Prisma para inyectar en las consultas compartidas
 */
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
          // A. El registro tiene asignado el equipo explícitamente
          { ownerTeamId: teamsFilter },

          // B. El dueño del registro pertenece a uno de mis equipos
          {
            owner: {
              teamMember: {
                some: { teamId: teamsFilter },
              },
            },
          },

          // C. El creador del registro pertenece a uno de mis equipos
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

/**
 * Valida de forma síncrona si un registro ya cargado en memoria cumple con el scope.
 * Útil para chequear mutaciones unitarias o llamadas findUnique post-fetch.
 */
export function checkRecordOwnership(
  record: any,
  ctx: ScopeContext,
  userTeamIds: string[],
): boolean {
  if (!record) return false;

  switch (ctx.scope) {
    case 'GLOBAL':
      return true;

    case 'OWN':
      return record.ownerId === ctx.userId || record.createdBy === ctx.userId;

    case 'TEAM':
      // Si el registro pertenece directamente al equipo
      if (record.ownerTeamId && userTeamIds.includes(record.ownerTeamId)) {
        return true;
      }
      // Nota: Si dependes de comprobar si el owner/creator del registro pertenece al equipo
      // de forma síncrona aquí, el "record" debería traer incluidos sus 'owner.teamMember' o 'creator.teamMember'.
      // Como alternativa segura, si no quieres abusar de "includes", puedes apoyarte en ejecutar
      // la mutación/búsqueda usando directamente "buildScopeFilter" en el 'where'.
      return false;
  }
}
