/*
  Warnings:

  - The primary key for the `rbac_modules` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `moduleKey` on the `rbac_role_permissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `rbac_modules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,moduleId,action]` on the table `rbac_role_permissions` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `rbac_modules` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `rbac_modules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moduleId` to the `rbac_role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rbac_role_permissions" DROP CONSTRAINT "rbac_role_permissions_moduleKey_fkey";

-- DropIndex
DROP INDEX "rbac_role_permissions_moduleKey_idx";

-- DropIndex
DROP INDEX "rbac_role_permissions_roleId_moduleKey_action_key";

-- AlterTable
ALTER TABLE "rbac_modules" DROP CONSTRAINT "rbac_modules_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerOrganizationId" TEXT,
ADD COLUMN     "ownerTeamId" TEXT,
ADD COLUMN     "restoreAt" TIMESTAMP(3),
ADD COLUMN     "restoreBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ADD CONSTRAINT "rbac_modules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "rbac_role_permissions" DROP COLUMN "moduleKey",
ADD COLUMN     "moduleId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rbac_modules_key_key" ON "rbac_modules"("key");

-- CreateIndex
CREATE INDEX "rbac_role_permissions_moduleId_idx" ON "rbac_role_permissions"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_permissions_roleId_moduleId_action_key" ON "rbac_role_permissions"("roleId", "moduleId", "action");

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_restoreBy_fkey" FOREIGN KEY ("restoreBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "org_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "rbac_modules"("key") ON DELETE CASCADE ON UPDATE CASCADE;
