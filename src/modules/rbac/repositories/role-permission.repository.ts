import { RolePermission } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class RolePermissionRepository extends BaseRepository<RolePermission> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'rolePermission');
  }

  async findByRole(roleId: string) {
    return this.findMany({ where: { roleId } });
  }

  async upsertPermission(roleId: string, resource: string, action: string, scope: string) {
    return this.upsert({
      where: { roleId_resource_action: { roleId, resource, action } },
      create: { roleId, resource, action, scope },
      update: { scope },
    });
  }
}
