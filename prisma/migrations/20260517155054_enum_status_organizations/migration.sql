/*
  Warnings:

  - The `status` column on the `document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `test_companies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'PENDING', 'TRASHED', 'INACTIVE', 'ARCHIVED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "document" DROP COLUMN "status",
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "org_organizations" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "restoreAt" TIMESTAMP(3),
ADD COLUMN     "restoreBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "test_companies" DROP COLUMN "status",
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "document_entityId_entityType_status_idx" ON "document"("entityId", "entityType", "status");

-- CreateIndex
CREATE INDEX "test_companies_status_idx" ON "test_companies"("status");

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_restoreBy_fkey" FOREIGN KEY ("restoreBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
