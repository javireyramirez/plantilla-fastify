/*
  Warnings:

  - You are about to drop the column `revokedBy` on the `rbac_role_permissions` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `rbac_role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rbac_role_permissions" DROP CONSTRAINT "rbac_role_permissions_revokedBy_fkey";

-- AlterTable
ALTER TABLE "rbac_role_permissions" DROP COLUMN "revokedBy",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
