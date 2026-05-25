/*
  Warnings:

  - The `accessLevel` column on the `rbac_entity_access` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[organizationId,slug]` on the table `rbac_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roleId` to the `org_team_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `rbac_roles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntityAccessLevel" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- AlterEnum
ALTER TYPE "PermissionAction" ADD VALUE 'MANAGE';

-- DropIndex
DROP INDEX "rbac_roles_organizationId_name_key";

-- AlterTable
ALTER TABLE "org_members" ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "removedBy" TEXT,
ADD COLUMN     "roleUpdatedBy" TEXT;

-- AlterTable
ALTER TABLE "org_team_members" ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "removedBy" TEXT,
ADD COLUMN     "roleId" TEXT NOT NULL,
ADD COLUMN     "roleUpdatedBy" TEXT;

-- AlterTable
ALTER TABLE "org_teams" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "restoreAt" TIMESTAMP(3),
ADD COLUMN     "restoreBy" TEXT,
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "rbac_entity_access" ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedBy" TEXT,
DROP COLUMN "accessLevel",
ADD COLUMN     "accessLevel" "EntityAccessLevel" NOT NULL DEFAULT 'VIEWER';

-- AlterTable
ALTER TABLE "rbac_role_permissions" ADD COLUMN     "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "grantedBy" TEXT,
ADD COLUMN     "revokedBy" TEXT,
ADD COLUMN     "scopeId" TEXT;

-- AlterTable
ALTER TABLE "rbac_roles" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerOrganizationId" TEXT,
ADD COLUMN     "ownerTeamId" TEXT,
ADD COLUMN     "restoreAt" TIMESTAMP(3),
ADD COLUMN     "restoreBy" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX "org_team_members_roleId_idx" ON "org_team_members"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_organizationId_slug_key" ON "rbac_roles"("organizationId", "slug");

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_restoreBy_fkey" FOREIGN KEY ("restoreBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "org_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_roleUpdatedBy_fkey" FOREIGN KEY ("roleUpdatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_restoreBy_fkey" FOREIGN KEY ("restoreBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_roleUpdatedBy_fkey" FOREIGN KEY ("roleUpdatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_entity_access" ADD CONSTRAINT "rbac_entity_access_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
