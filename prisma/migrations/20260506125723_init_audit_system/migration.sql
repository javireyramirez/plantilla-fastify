-- AlterTable
ALTER TABLE "document" ADD COLUMN     "restoreAt" TIMESTAMP(3),
ADD COLUMN     "restoreBy" TEXT;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_restoreBy_fkey" FOREIGN KEY ("restoreBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
