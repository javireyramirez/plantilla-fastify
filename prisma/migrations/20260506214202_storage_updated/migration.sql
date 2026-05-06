-- AlterTable
ALTER TABLE "document" ADD COLUMN     "updatedBy" TEXT;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
