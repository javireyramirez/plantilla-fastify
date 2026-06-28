-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SOFT_DELETE', 'RESTORE', 'HARD_DELETE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "sys_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "moduleId" TEXT,
    "moduleSlug" TEXT,
    "entityId" TEXT,
    "displayName" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_trash_bin" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "ownerId" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "sys_trash_bin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_audit_logs_action_idx" ON "sys_audit_logs"("action");

-- CreateIndex
CREATE INDEX "sys_audit_logs_moduleSlug_entityId_idx" ON "sys_audit_logs"("moduleSlug", "entityId");

-- CreateIndex
CREATE INDEX "sys_audit_logs_createdAt_idx" ON "sys_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "sys_trash_bin_expiresAt_idx" ON "sys_trash_bin"("expiresAt");

-- CreateIndex
CREATE INDEX "sys_trash_bin_deletedAt_idx" ON "sys_trash_bin"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sys_trash_bin_moduleSlug_entityId_key" ON "sys_trash_bin"("moduleSlug", "entityId");

-- AddForeignKey
ALTER TABLE "sys_audit_logs" ADD CONSTRAINT "sys_audit_logs_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "rbac_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_audit_logs" ADD CONSTRAINT "sys_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_trash_bin" ADD CONSTRAINT "sys_trash_bin_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "rbac_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_trash_bin" ADD CONSTRAINT "sys_trash_bin_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
