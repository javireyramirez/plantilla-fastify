/*
  Warnings:

  - You are about to drop the column `removedBy` on the `org_members` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "org_members" DROP CONSTRAINT "org_members_removedBy_fkey";

-- AlterTable
ALTER TABLE "org_members" DROP COLUMN "removedBy";

-- AlterTable
ALTER TABLE "org_teams" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerOrganizationId" TEXT,
ADD COLUMN     "ownerTeamId" TEXT;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "org_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
