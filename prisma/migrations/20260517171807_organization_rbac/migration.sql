-- AlterTable
ALTER TABLE "org_organizations" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerOrganizationId" TEXT,
ADD COLUMN     "ownerTeamId" TEXT;

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "org_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_organizations" ADD CONSTRAINT "org_organizations_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
