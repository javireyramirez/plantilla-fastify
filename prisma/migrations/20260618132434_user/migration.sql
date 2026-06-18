/*
  Warnings:

  - You are about to drop the column `restoredBy ` on the `auth_users` table. All the data in the column will be lost.
  - You are about to drop the column `restoredBy ` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `restoredBy ` on the `rbac_modules` table. All the data in the column will be lost.
  - You are about to drop the column `restoredBy ` on the `rbac_roles` table. All the data in the column will be lost.
  - You are about to drop the column `restoredBy ` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `restoredBy ` on the `test_companies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_restoredBy _fkey";

-- DropForeignKey
ALTER TABLE "rbac_modules" DROP CONSTRAINT "rbac_modules_restoredBy _fkey";

-- DropForeignKey
ALTER TABLE "rbac_roles" DROP CONSTRAINT "rbac_roles_restoredBy _fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_restoredBy _fkey";

-- DropForeignKey
ALTER TABLE "test_companies" DROP CONSTRAINT "test_companies_restoredBy _fkey";

-- AlterTable
ALTER TABLE "auth_users" DROP COLUMN "restoredBy ",
ADD COLUMN     "restoredBy" TEXT;

-- AlterTable
ALTER TABLE "document" DROP COLUMN "restoredBy ",
ADD COLUMN     "restoredBy" TEXT;

-- AlterTable
ALTER TABLE "rbac_modules" DROP COLUMN "restoredBy ",
ADD COLUMN     "restoredBy" TEXT;

-- AlterTable
ALTER TABLE "rbac_roles" DROP COLUMN "restoredBy ",
ADD COLUMN     "restoredBy" TEXT;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "restoredBy ",
ADD COLUMN     "restoredBy" TEXT;

-- AlterTable
ALTER TABLE "test_companies" DROP COLUMN "restoredBy ",
ADD COLUMN     "restoredBy" TEXT;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
