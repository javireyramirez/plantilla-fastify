/*
  Warnings:

  - The `scope` column on the `rbac_role_permissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `action` on the `rbac_role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('ALL', 'ORGANIZATION', 'TEAM', 'OWN');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'EXPORT', 'IMPORT');

-- AlterTable
ALTER TABLE "rbac_entity_access" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "rbac_role_permissions" DROP COLUMN "action",
ADD COLUMN     "action" "PermissionAction" NOT NULL,
DROP COLUMN "scope",
ADD COLUMN     "scope" "PermissionScope" NOT NULL DEFAULT 'OWN';

-- CreateIndex
CREATE INDEX "rbac_entity_access_expiresAt_idx" ON "rbac_entity_access"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_permissions_roleId_resource_action_key" ON "rbac_role_permissions"("roleId", "resource", "action");
