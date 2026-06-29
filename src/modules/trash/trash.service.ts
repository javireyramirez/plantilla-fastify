import { PermissionAction, PermissionScope } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { HttpError } from '@/utils/http.error.js';

export class TrashService {
  constructor(private readonly fastify: FastifyInstance) {}

  private getService(moduleSlug: string) {
    const servicesMap: Record<string, any> = {
      companies: this.fastify.companiesService,
      users: this.fastify.usersService,
      roles: this.fastify.roleService,
      teams: this.fastify.teamService,
      modules: this.fastify.moduleService,
      documents: this.fastify.storageService,
    };
    return servicesMap[moduleSlug];
  }

  async getUserPermissions(userId: string, teamIds: string[] = []): Promise<Record<string, { scope: string }>> {
    const assignments = await this.fastify.prisma.roleAssignment.findMany({
      where: {
        OR: [{ userId }, ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : [])],
      },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                action: { in: ['READ', 'RESTORE'] },
              },
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    const permissions: Record<string, { scope: string }> = {};

    for (const assignment of assignments) {
      for (const perm of assignment.role.permissions) {
        const moduleSlug = perm.module.slug;
        const currentScope = perm.scope;

        if (!permissions[moduleSlug]) {
          permissions[moduleSlug] = { scope: currentScope };
        } else {
          const SCOPE_PRIORITY: Record<string, number> = { GLOBAL: 3, TEAM: 2, OWN: 1 };
          const best = permissions[moduleSlug].scope;
          if (SCOPE_PRIORITY[currentScope] > SCOPE_PRIORITY[best]) {
            permissions[moduleSlug].scope = currentScope;
          }
        }
      }
    }

    return permissions;
  }

  async getAuthorizedTrash(params: {
    userId: string;
    isSuperAdmin: boolean;
    teamIds: string[];
    category: 'entities' | 'documents';
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    let allowedModules: Record<string, { scope: string }> = {};

    if (params.isSuperAdmin) {
      const modules = await this.fastify.prisma.module.findMany({
        select: { slug: true },
      });
      for (const mod of modules) {
        allowedModules[mod.slug] = { scope: 'GLOBAL' };
      }
    } else {
      allowedModules = await this.getUserPermissions(params.userId, params.teamIds);
    }

    const orConditions = Object.entries(allowedModules).map(([moduleSlug, perm]) => {
      const scope = perm.scope;
      const baseCondition: any = { moduleSlug };

      if (scope === 'OWN') {
        return {
          ...baseCondition,
          OR: [
            { ownerId: params.userId },
            { createdBy: params.userId },
            { deletedBy: params.userId },
          ],
        };
      }

      if (scope === 'TEAM') {
        return {
          ...baseCondition,
          OR: [
            { ownerId: { in: params.teamIds } },
            { createdBy: { in: params.teamIds } },
            { deletedBy: { in: params.teamIds } },
          ],
        };
      }

      return baseCondition;
    });

    if (orConditions.length === 0) {
      return { data: [], total: 0 };
    }

    const whereClause: any = {
      OR: orConditions,
      moduleSlug: params.category === 'documents' ? 'documents' : { not: 'documents' },
    };

    if (params.search) {
      whereClause.displayName = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    const [data, total] = await this.fastify.prisma.$transaction([
      this.fastify.prisma.trashBin.findMany({
        where: whereClause,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip,
        take,
      }),
      this.fastify.prisma.trashBin.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async restore(moduleSlug: string, id: string, userId: string, scope?: any) {
    const trashItem = await this.fastify.prisma.trashBin.findUnique({
      where: { moduleSlug_entityId: { moduleSlug, entityId: id } },
    });

    if (!trashItem) {
      throw new HttpError(404, 'Elemento no encontrado en la papelera');
    }

    const service = this.getService(moduleSlug);
    if (!service) {
      throw new HttpError(500, `Servicio no configurado para el módulo: ${moduleSlug}`);
    }

    return service.restore(trashItem.entityId, { userId, scope });
  }

  async purge(moduleSlug: string, id: string, userId: string, scope?: any) {
    const trashItem = await this.fastify.prisma.trashBin.findUnique({
      where: { moduleSlug_entityId: { moduleSlug, entityId: id } },
    });

    if (!trashItem) {
      throw new HttpError(404, 'Elemento no encontrado en la papelera');
    }

    const service = this.getService(moduleSlug);
    if (!service) {
      throw new HttpError(500, `Servicio no configurado para el módulo: ${moduleSlug}`);
    }

    await this.fastify.prisma.$transaction([
      this.fastify.prisma.trashBin.delete({
        where: { moduleSlug_entityId: { moduleSlug, entityId: id } },
      }),
      this.fastify.prisma.auditLog.create({
        data: {
          userId,
          action: 'HARD_DELETE',
          moduleId: trashItem.moduleId,
          moduleSlug: trashItem.moduleSlug,
          entityId: id,
          displayName: trashItem.displayName,
          description: 'Purged permanently by user',
        },
      }),
    ]);

    await service.hardDelete(trashItem.entityId, { scope });
  }

  async emptyExpiredTrash() {
    const now = new Date();

    const expiredItems = await this.fastify.prisma.trashBin.findMany({
      where: { expiresAt: { lte: now } },
    });

    if (expiredItems.length === 0) return { count: 0 };

    const grouped = expiredItems.reduce((acc, item) => {
      acc[item.moduleSlug] = acc[item.moduleSlug] || [];
      acc[item.moduleSlug].push(item);
      return acc;
    }, {} as Record<string, typeof expiredItems>);

    let purgedCount = 0;

    for (const [moduleSlug, items] of Object.entries(grouped)) {
      const ids = items.map((item) => item.entityId);
      const service = this.getService(moduleSlug);

      if (service) {
        await service.hardDeleteMany(ids);
      }

      await this.fastify.prisma.$transaction([
        this.fastify.prisma.trashBin.deleteMany({
          where: {
            moduleSlug,
            entityId: { in: ids },
          },
        }),
        ...items.map((item) =>
          this.fastify.prisma.auditLog.create({
            data: {
              action: 'HARD_DELETE',
              moduleId: item.moduleId,
              moduleSlug: item.moduleSlug,
              entityId: item.entityId,
              displayName: item.displayName,
              description: 'Automatic purge after retention period expired',
            },
          })
        ),
      ]);

      purgedCount += items.length;
    }

    return { count: purgedCount };
  }

  async getUserPermissionsForAction(
    userId: string,
    teamIds: string[],
    action: PermissionAction,
  ): Promise<Record<string, { scope: PermissionScope }>> {
    const assignments = await this.fastify.prisma.roleAssignment.findMany({
      where: {
        OR: [{ userId }, ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : [])],
      },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                action,
              },
              include: {
                module: true,
              },
            },
          },
        },
      },
    });

    const permissions: Record<string, { scope: PermissionScope }> = {};

    for (const assignment of assignments) {
      for (const perm of assignment.role.permissions) {
        const moduleSlug = perm.module.slug;
        const currentScope = perm.scope;

        if (!permissions[moduleSlug]) {
          permissions[moduleSlug] = { scope: currentScope };
        } else {
          const SCOPE_PRIORITY: Record<PermissionScope, number> = { GLOBAL: 3, TEAM: 2, OWN: 1 };
          const best = permissions[moduleSlug].scope;
          if (SCOPE_PRIORITY[currentScope] > SCOPE_PRIORITY[best]) {
            permissions[moduleSlug].scope = currentScope;
          }
        }
      }
    }

    return permissions;
  }

  async restoreMany(
    ids: string[],
    userId: string,
    teamIds: string[],
    isSuperAdmin: boolean,
  ): Promise<{ count: number }> {
    if (!ids.length) return { count: 0 };

    const trashItems = await this.fastify.prisma.trashBin.findMany({
      where: { id: { in: ids } },
    });

    if (!trashItems.length) return { count: 0 };

    let allowedModules: Record<string, { scope: PermissionScope }> = {};
    if (isSuperAdmin) {
      const modules = await this.fastify.prisma.module.findMany({
        select: { slug: true },
      });
      for (const mod of modules) {
        allowedModules[mod.slug] = { scope: 'GLOBAL' };
      }
    } else {
      allowedModules = await this.getUserPermissionsForAction(userId, teamIds, PermissionAction.RESTORE);
    }

    for (const item of trashItems) {
      const perm = allowedModules[item.moduleSlug];
      if (!perm) {
        throw new HttpError(403, `No tiene permisos para restaurar elementos del módulo: ${item.moduleSlug}`);
      }

      const scope = perm.scope;
      if (scope === 'OWN') {
        const isOwner =
          item.ownerId === userId ||
          item.createdBy === userId ||
          item.deletedBy === userId;
        if (!isOwner) {
          throw new HttpError(403, `No tiene permisos para restaurar el elemento: ${item.displayName}`);
        }
      } else if (scope === 'TEAM') {
        const isTeam =
          (item.ownerId && teamIds.includes(item.ownerId)) ||
          (item.createdBy && teamIds.includes(item.createdBy)) ||
          (item.deletedBy && teamIds.includes(item.deletedBy));
        if (!isTeam) {
          throw new HttpError(403, `No tiene permisos para restaurar el elemento: ${item.displayName}`);
        }
      }
    }

    const grouped = trashItems.reduce((acc, item) => {
      acc[item.moduleSlug] = acc[item.moduleSlug] || [];
      acc[item.moduleSlug].push(item);
      return acc;
    }, {} as Record<string, typeof trashItems>);

    let restoredCount = 0;

    for (const [moduleSlug, items] of Object.entries(grouped)) {
      const entityIds = items.map((item) => item.entityId);
      const service = this.getService(moduleSlug);

      if (!service) {
        throw new HttpError(500, `Servicio no configurado para el módulo: ${moduleSlug}`);
      }

      const perm = allowedModules[moduleSlug];
      const scopeContext = {
        scope: perm.scope,
        userId,
        teamIds,
      };

      const restoreResult = await service.restoreMany(entityIds, { userId, scope: scopeContext });
      restoredCount += restoreResult.count;
    }

    return { count: restoredCount };
  }

  async purgeMany(
    ids: string[],
    userId: string,
    teamIds: string[],
    isSuperAdmin: boolean,
  ): Promise<{ count: number }> {
    if (!ids.length) return { count: 0 };

    const trashItems = await this.fastify.prisma.trashBin.findMany({
      where: { id: { in: ids } },
    });

    if (!trashItems.length) return { count: 0 };

    let allowedModules: Record<string, { scope: PermissionScope }> = {};
    if (isSuperAdmin) {
      const modules = await this.fastify.prisma.module.findMany({
        select: { slug: true },
      });
      for (const mod of modules) {
        allowedModules[mod.slug] = { scope: 'GLOBAL' };
      }
    } else {
      allowedModules = await this.getUserPermissionsForAction(userId, teamIds, PermissionAction.DELETE);
    }

    for (const item of trashItems) {
      const perm = allowedModules[item.moduleSlug];
      if (!perm) {
        throw new HttpError(403, `No tiene permisos para purgar elementos del módulo: ${item.moduleSlug}`);
      }

      const scope = perm.scope;
      if (scope === 'OWN') {
        const isOwner =
          item.ownerId === userId ||
          item.createdBy === userId ||
          item.deletedBy === userId;
        if (!isOwner) {
          throw new HttpError(403, `No tiene permisos para purgar el elemento: ${item.displayName}`);
        }
      } else if (scope === 'TEAM') {
        const isTeam =
          (item.ownerId && teamIds.includes(item.ownerId)) ||
          (item.createdBy && teamIds.includes(item.createdBy)) ||
          (item.deletedBy && teamIds.includes(item.deletedBy));
        if (!isTeam) {
          throw new HttpError(403, `No tiene permisos para purgar el elemento: ${item.displayName}`);
        }
      }
    }

    const grouped = trashItems.reduce((acc, item) => {
      acc[item.moduleSlug] = acc[item.moduleSlug] || [];
      acc[item.moduleSlug].push(item);
      return acc;
    }, {} as Record<string, typeof trashItems>);

    let purgedCount = 0;

    for (const [moduleSlug, items] of Object.entries(grouped)) {
      const entityIds = items.map((item) => item.entityId);
      const service = this.getService(moduleSlug);

      if (!service) {
        throw new HttpError(500, `Servicio no configurado para el módulo: ${moduleSlug}`);
      }

      const perm = allowedModules[moduleSlug];
      const scopeContext = {
        scope: perm.scope,
        userId,
        teamIds,
      };

      await this.fastify.prisma.trashBin.deleteMany({
        where: {
          moduleSlug,
          entityId: { in: entityIds },
        },
      });

      const deleteResult = await service.hardDeleteMany(entityIds, { userId, scope: scopeContext });
      purgedCount += deleteResult.count;
    }

    return { count: purgedCount };
  }
}
