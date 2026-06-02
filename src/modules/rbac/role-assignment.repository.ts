import { RoleAssignment } from '@prisma/client';
import { FastifyInstance } from 'fastify';

import { BaseRepository } from '@/repositories/base.repository.js';

export class RoleAssignmentRepository extends BaseRepository<RoleAssignment> {
  constructor(prisma: FastifyInstance['prisma']) {
    super(prisma, 'roleAssignment');
  }

  async findByRole(roleId: string) {
    return this.findMany({ where: { roleId } });
  }

  async upsertAssignment(roleId: string, resource: string, action: string, scope: string) {
    return this.upsert({
      where: { roleId_resource_action: { roleId, resource, action } },
      create: { roleId, resource, action, scope },
      update: { scope },
    });
  }
}
