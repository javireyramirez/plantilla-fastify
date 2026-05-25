/*
  Warnings:

  - You are about to drop the column `removedBy` on the `org_team_members` table. All the data in the column will be lost.
  - You are about to drop the column `roleUpdatedBy` on the `org_team_members` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "org_team_members" DROP CONSTRAINT "org_team_members_removedBy_fkey";

-- DropForeignKey
ALTER TABLE "org_team_members" DROP CONSTRAINT "org_team_members_roleUpdatedBy_fkey";

-- AlterTable
ALTER TABLE "auth_users" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "org_team_members" DROP COLUMN "removedBy",
DROP COLUMN "roleUpdatedBy";
