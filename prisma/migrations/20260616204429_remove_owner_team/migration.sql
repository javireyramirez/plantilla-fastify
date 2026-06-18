/*
  Warnings:

  - You are about to drop the column `ownerTeamId` on the `test_companies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "test_companies" DROP CONSTRAINT "test_companies_ownerTeamId_fkey";

-- DropIndex
DROP INDEX "test_companies_ownerTeamId_idx";

-- AlterTable
ALTER TABLE "test_companies" DROP COLUMN "ownerTeamId";
