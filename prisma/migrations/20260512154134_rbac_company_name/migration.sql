-- AlterTable
ALTER TABLE "document" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerOrganizationId" TEXT,
ADD COLUMN     "ownerTeamId" TEXT;

-- CreateTable
CREATE TABLE "rbac_roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rbac_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'own',

    CONSTRAINT "rbac_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_teams" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "org_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "sector" TEXT,
    "website" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "restoreAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoreBy" TEXT,
    "updatedBy" TEXT,
    "ownerId" TEXT,
    "ownerTeamId" TEXT,
    "ownerOrganizationId" TEXT,

    CONSTRAINT "test_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_entity_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'viewer',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_entity_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rbac_roles_organizationId_idx" ON "rbac_roles"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_organizationId_name_key" ON "rbac_roles"("organizationId", "name");

-- CreateIndex
CREATE INDEX "rbac_role_permissions_roleId_idx" ON "rbac_role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "rbac_role_permissions_resource_idx" ON "rbac_role_permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_permissions_roleId_resource_action_key" ON "rbac_role_permissions"("roleId", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "org_organizations_slug_key" ON "org_organizations"("slug");

-- CreateIndex
CREATE INDEX "org_organizations_slug_idx" ON "org_organizations"("slug");

-- CreateIndex
CREATE INDEX "org_members_userId_idx" ON "org_members"("userId");

-- CreateIndex
CREATE INDEX "org_members_organizationId_idx" ON "org_members"("organizationId");

-- CreateIndex
CREATE INDEX "org_members_roleId_idx" ON "org_members"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_userId_organizationId_key" ON "org_members"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "org_teams_organizationId_idx" ON "org_teams"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "org_teams_organizationId_name_key" ON "org_teams"("organizationId", "name");

-- CreateIndex
CREATE INDEX "org_team_members_teamId_idx" ON "org_team_members"("teamId");

-- CreateIndex
CREATE INDEX "org_team_members_memberId_idx" ON "org_team_members"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "org_team_members_teamId_memberId_key" ON "org_team_members"("teamId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "test_companies_nif_key" ON "test_companies"("nif");

-- CreateIndex
CREATE INDEX "test_companies_nif_idx" ON "test_companies"("nif");

-- CreateIndex
CREATE INDEX "test_companies_status_idx" ON "test_companies"("status");

-- CreateIndex
CREATE INDEX "test_companies_ownerId_idx" ON "test_companies"("ownerId");

-- CreateIndex
CREATE INDEX "test_companies_ownerTeamId_idx" ON "test_companies"("ownerTeamId");

-- CreateIndex
CREATE INDEX "test_companies_ownerOrganizationId_idx" ON "test_companies"("ownerOrganizationId");

-- CreateIndex
CREATE INDEX "rbac_entity_access_userId_entityName_idx" ON "rbac_entity_access"("userId", "entityName");

-- CreateIndex
CREATE INDEX "rbac_entity_access_entityName_entityId_idx" ON "rbac_entity_access"("entityName", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_entity_access_userId_entityName_entityId_key" ON "rbac_entity_access"("userId", "entityName", "entityId");

-- CreateIndex
CREATE INDEX "document_ownerId_idx" ON "document"("ownerId");

-- CreateIndex
CREATE INDEX "document_ownerTeamId_idx" ON "document"("ownerTeamId");

-- CreateIndex
CREATE INDEX "document_ownerOrganizationId_idx" ON "document"("ownerOrganizationId");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "org_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_teams" ADD CONSTRAINT "org_teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "org_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_team_members" ADD CONSTRAINT "org_team_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "org_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_restoreBy_fkey" FOREIGN KEY ("restoreBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "org_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_entity_access" ADD CONSTRAINT "rbac_entity_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_entity_access" ADD CONSTRAINT "rbac_entity_access_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
