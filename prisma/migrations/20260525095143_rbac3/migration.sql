/*
  Warnings:

  - The values [MANAGE] on the enum `PermissionAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [ALL] on the enum `PermissionScope` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `role` on the `auth_users` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `org_members` table. All the data in the column will be lost.
  - You are about to drop the column `roleUpdatedBy` on the `org_members` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `org_team_members` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `rbac_entity_access` table. All the data in the column will be lost.
  - You are about to drop the column `resource` on the `rbac_role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `scopeId` on the `rbac_role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `rbac_roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[principalType,principalId,entityName,entityId]` on the table `rbac_entity_access` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,moduleKey,action]` on the table `rbac_role_permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `rbac_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `principalId` to the `rbac_entity_access` table without a default value. This is not possible if the table is not empty.
  - Added the required column `principalType` to the `rbac_entity_access` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moduleKey` to the `rbac_role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PrincipalType" AS ENUM ('USER', 'TEAM', 'ORGANIZATION');

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionAction_new" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'EXPORT', 'IMPORT', 'SETTINGS');
ALTER TABLE "rbac_role_permissions" ALTER COLUMN "action" TYPE "PermissionAction_new" USING ("action"::text::"PermissionAction_new");
ALTER TYPE "PermissionAction" RENAME TO "PermissionAction_old";
ALTER TYPE "PermissionAction_new" RENAME TO "PermissionAction";
DROP TYPE "public"."PermissionAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionScope_new" AS ENUM ('GLOBAL', 'ORGANIZATION', 'TEAM', 'OWN');
ALTER TABLE "public"."rbac_role_permissions" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "rbac_role_permissions" ALTER COLUMN "scope" TYPE "PermissionScope_new" USING ("scope"::text::"PermissionScope_new");
ALTER TYPE "PermissionScope" RENAME TO "PermissionScope_old";
ALTER TYPE "PermissionScope_new" RENAME TO "PermissionScope";
DROP TYPE "public"."PermissionScope_old";
ALTER TABLE "rbac_role_permissions" ALTER COLUMN "scope" SET DEFAULT 'OWN';
COMMIT;

-- DropForeignKey
ALTER TABLE "org_members" DROP CONSTRAINT "org_members_roleId_fkey";

-- DropForeignKey
ALTER TABLE "org_members" DROP CONSTRAINT "org_members_roleUpdatedBy_fkey";

-- DropForeignKey
ALTER TABLE "org_team_members" DROP CONSTRAINT "org_team_members_roleId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_entity_access" DROP CONSTRAINT "rbac_entity_access_userId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_roles" DROP CONSTRAINT "rbac_roles_organizationId_fkey";

-- DropIndex
DROP INDEX "org_members_roleId_idx";

-- DropIndex
DROP INDEX "org_team_members_roleId_idx";

-- DropIndex
DROP INDEX "rbac_entity_access_userId_entityName_entityId_key";

-- DropIndex
DROP INDEX "rbac_entity_access_userId_entityName_idx";

-- DropIndex
DROP INDEX "rbac_role_permissions_resource_idx";

-- DropIndex
DROP INDEX "rbac_role_permissions_roleId_resource_action_key";

-- DropIndex
DROP INDEX "rbac_roles_organizationId_idx";

-- DropIndex
DROP INDEX "rbac_roles_organizationId_slug_key";

-- AlterTable
ALTER TABLE "auth_users" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "org_members" DROP COLUMN "roleId",
DROP COLUMN "roleUpdatedBy";

-- AlterTable
ALTER TABLE "org_organizations" ADD COLUMN     "byDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "org_team_members" DROP COLUMN "roleId";

-- AlterTable
ALTER TABLE "rbac_entity_access" DROP COLUMN "userId",
ADD COLUMN     "principalId" TEXT NOT NULL,
ADD COLUMN     "principalType" "PrincipalType" NOT NULL;

-- AlterTable
ALTER TABLE "rbac_role_permissions" DROP COLUMN "resource",
DROP COLUMN "scopeId",
ADD COLUMN     "moduleKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "rbac_roles" DROP COLUMN "organizationId",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "icon" TEXT;

-- CreateTable
CREATE TABLE "rbac_modules" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultPermissions" JSONB,
    "isConfigurableByOrg" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rbac_modules_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "rbac_role_assignments" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "targetOrgId" TEXT,
    "organizationId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "rbac_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rbac_role_assignments_userId_idx" ON "rbac_role_assignments"("userId");

-- CreateIndex
CREATE INDEX "rbac_role_assignments_teamId_idx" ON "rbac_role_assignments"("teamId");

-- CreateIndex
CREATE INDEX "rbac_role_assignments_targetOrgId_idx" ON "rbac_role_assignments"("targetOrgId");

-- CreateIndex
CREATE INDEX "rbac_role_assignments_organizationId_idx" ON "rbac_role_assignments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_entity_access_principalType_principalId_entityName_ent_key" ON "rbac_entity_access"("principalType", "principalId", "entityName", "entityId");

-- CreateIndex
CREATE INDEX "rbac_role_permissions_moduleKey_idx" ON "rbac_role_permissions"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_permissions_roleId_moduleKey_action_key" ON "rbac_role_permissions"("roleId", "moduleKey", "action");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_slug_key" ON "rbac_roles"("slug");

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_moduleKey_fkey" FOREIGN KEY ("moduleKey") REFERENCES "rbac_modules"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "org_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_targetOrgId_fkey" FOREIGN KEY ("targetOrgId") REFERENCES "org_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
