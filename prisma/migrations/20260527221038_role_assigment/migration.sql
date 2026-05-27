/*
  Warnings:

  - A unique constraint covering the columns `[roleId,userId,organizationId]` on the table `rbac_role_assignments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,teamId,organizationId]` on the table `rbac_role_assignments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,targetOrgId,organizationId]` on the table `rbac_role_assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_assignments_roleId_userId_organizationId_key" ON "rbac_role_assignments"("roleId", "userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_assignments_roleId_teamId_organizationId_key" ON "rbac_role_assignments"("roleId", "teamId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_assignments_roleId_targetOrgId_organizationId_key" ON "rbac_role_assignments"("roleId", "targetOrgId", "organizationId");
