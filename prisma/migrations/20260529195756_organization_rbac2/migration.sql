/*
  Warnings:

  - You are about to drop the column `byDefault` on the `org_organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "org_members" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "org_organizations" DROP COLUMN "byDefault";
