-- DropForeignKey
ALTER TABLE "rbac_role_permissions" DROP CONSTRAINT "rbac_role_permissions_moduleId_fkey";

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "rbac_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
