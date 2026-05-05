-- DropIndex
DROP INDEX "document_entityId_entityType_idx";

-- DropIndex
DROP INDEX "document_status_idx";

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ALTER COLUMN "isPublic" SET DEFAULT false;

-- CreateIndex
CREATE INDEX "document_entityId_entityType_status_idx" ON "document"("entityId", "entityType", "status");

-- CreateIndex
CREATE INDEX "document_fileName_idx" ON "document"("fileName");

-- CreateIndex
CREATE INDEX "document_createdAt_idx" ON "document"("createdAt");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
