/*
  Warnings:

  - You are about to drop the column `isActive` on the `org_organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "org_organizations" DROP COLUMN "isActive",
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';
