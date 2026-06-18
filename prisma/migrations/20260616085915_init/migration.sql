-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'PENDING', 'TRASHED', 'INACTIVE', 'ARCHIVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'WELCOME', 'NOTIFICATION', 'MARKETING');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('GLOBAL', 'TEAM', 'OWN');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'EXPORT', 'IMPORT', 'SETTINGS');

-- CreateEnum
CREATE TYPE "PrincipalType" AS ENUM ('USER', 'TEAM');

-- CreateTable
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoredBy " TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_email_verification_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "secret" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "providerId" TEXT,
    "templateId" TEXT,
    "metadata" JSONB,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "checksum" TEXT,
    "metadata" JSONB,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoredBy " TEXT,
    "updatedBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_modules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultPermissions" JSONB,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoredBy " TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rbac_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoredBy " TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rbac_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'OWN',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "grantedBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "rbac_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_role_assignments" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "rbac_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoredBy " TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_users" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,

    CONSTRAINT "team_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "sector" TEXT,
    "website" TEXT,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "deletedBy" TEXT,
    "restoredBy " TEXT,
    "updatedBy" TEXT,
    "ownerId" TEXT,
    "ownerTeamId" TEXT,

    CONSTRAINT "test_companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- CreateIndex
CREATE INDEX "auth_users_email_idx" ON "auth_users"("email");

-- CreateIndex
CREATE INDEX "auth_users_isActive_idx" ON "auth_users"("isActive");

-- CreateIndex
CREATE INDEX "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_providerId_accountId_key" ON "auth_accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_isValid_idx" ON "auth_sessions"("isValid");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_token_key" ON "auth_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_verification_tokens_expires_idx" ON "auth_verification_tokens"("expires");

-- CreateIndex
CREATE INDEX "auth_verification_tokens_used_idx" ON "auth_verification_tokens"("used");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key" ON "auth_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_password_reset_tokens_token_key" ON "auth_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_password_reset_tokens_email_idx" ON "auth_password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "auth_password_reset_tokens_token_idx" ON "auth_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_password_reset_tokens_expires_idx" ON "auth_password_reset_tokens"("expires");

-- CreateIndex
CREATE INDEX "auth_password_reset_tokens_used_idx" ON "auth_password_reset_tokens"("used");

-- CreateIndex
CREATE INDEX "auth_email_verification_codes_email_idx" ON "auth_email_verification_codes"("email");

-- CreateIndex
CREATE INDEX "auth_email_verification_codes_code_idx" ON "auth_email_verification_codes"("code");

-- CreateIndex
CREATE INDEX "auth_email_verification_codes_expires_idx" ON "auth_email_verification_codes"("expires");

-- CreateIndex
CREATE INDEX "auth_email_verification_codes_used_idx" ON "auth_email_verification_codes"("used");

-- CreateIndex
CREATE INDEX "auth_keys_userId_idx" ON "auth_keys"("userId");

-- CreateIndex
CREATE INDEX "auth_keys_isActive_idx" ON "auth_keys"("isActive");

-- CreateIndex
CREATE INDEX "auth_login_attempts_email_idx" ON "auth_login_attempts"("email");

-- CreateIndex
CREATE INDEX "auth_login_attempts_createdAt_idx" ON "auth_login_attempts"("createdAt");

-- CreateIndex
CREATE INDEX "auth_login_attempts_success_idx" ON "auth_login_attempts"("success");

-- CreateIndex
CREATE UNIQUE INDEX "email_log_providerId_key" ON "email_log"("providerId");

-- CreateIndex
CREATE INDEX "email_log_userId_idx" ON "email_log"("userId");

-- CreateIndex
CREATE INDEX "email_log_providerId_idx" ON "email_log"("providerId");

-- CreateIndex
CREATE INDEX "email_log_status_idx" ON "email_log"("status");

-- CreateIndex
CREATE INDEX "email_log_createdAt_idx" ON "email_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_fileKey_key" ON "document"("fileKey");

-- CreateIndex
CREATE INDEX "document_entityId_entityType_status_idx" ON "document"("entityId", "entityType", "status");

-- CreateIndex
CREATE INDEX "document_fileName_idx" ON "document"("fileName");

-- CreateIndex
CREATE INDEX "document_createdAt_idx" ON "document"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_modules_key_key" ON "rbac_modules"("key");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_name_key" ON "rbac_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_slug_key" ON "rbac_roles"("slug");

-- CreateIndex
CREATE INDEX "rbac_roles_name_idx" ON "rbac_roles"("name");

-- CreateIndex
CREATE INDEX "rbac_roles_isSystem_idx" ON "rbac_roles"("isSystem");

-- CreateIndex
CREATE INDEX "rbac_role_permissions_roleId_idx" ON "rbac_role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "rbac_role_permissions_moduleId_idx" ON "rbac_role_permissions"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_permissions_roleId_moduleId_action_key" ON "rbac_role_permissions"("roleId", "moduleId", "action");

-- CreateIndex
CREATE INDEX "rbac_role_assignments_userId_idx" ON "rbac_role_assignments"("userId");

-- CreateIndex
CREATE INDEX "rbac_role_assignments_teamId_idx" ON "rbac_role_assignments"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_assignments_roleId_userId_key" ON "rbac_role_assignments"("roleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_role_assignments_roleId_teamId_key" ON "rbac_role_assignments"("roleId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "team_users_teamId_idx" ON "team_users"("teamId");

-- CreateIndex
CREATE INDEX "team_users_userId_idx" ON "team_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_users_teamId_userId_key" ON "team_users"("teamId", "userId");

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

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_keys" ADD CONSTRAINT "auth_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_restoredBy _fkey" FOREIGN KEY ("restoredBy ") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_restoredBy _fkey" FOREIGN KEY ("restoredBy ") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_modules" ADD CONSTRAINT "rbac_modules_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_restoredBy _fkey" FOREIGN KEY ("restoredBy ") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_roles" ADD CONSTRAINT "rbac_roles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_permissions" ADD CONSTRAINT "rbac_role_permissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "rbac_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_role_assignments" ADD CONSTRAINT "rbac_role_assignments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_restoredBy _fkey" FOREIGN KEY ("restoredBy ") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_users" ADD CONSTRAINT "team_users_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_users" ADD CONSTRAINT "team_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_users" ADD CONSTRAINT "team_users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_restoredBy _fkey" FOREIGN KEY ("restoredBy ") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_companies" ADD CONSTRAINT "test_companies_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
