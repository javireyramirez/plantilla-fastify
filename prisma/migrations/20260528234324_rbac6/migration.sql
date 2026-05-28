/*
  Warnings:

  - You are about to drop the column `ownerId` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `ownerOrganizationId` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `ownerTeamId` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `org_teams` table. All the data in the column will be lost.
  - You are about to drop the column `ownerOrganizationId` on the `org_teams` table. All the data in the column will be lost.
  - You are about to drop the column `ownerTeamId` on the `org_teams` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `rbac_modules` table. All the data in the column will be lost.
  - You are about to drop the column `ownerOrganizationId` on the `rbac_modules` table. All the data in the column will be lost.
  - You are about to drop the column `ownerTeamId` on the `rbac_modules` table. All the data in the column will be lost.
  - You are about to drop the column `targetOrgId` on the `rbac_role_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `rbac_roles` table. All the data in the column will be lost.
  - You are about to drop the column `ownerOrganizationId` on the `rbac_roles` table. All the data in the column will be lost.
  - You are about to drop the column `ownerTeamId` on the `rbac_roles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_ownerOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_ownerTeamId_fkey";

-- DropForeignKey
ALTER TABLE "org_teams" DROP CONSTRAINT "org_teams_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "org_teams" DROP CONSTRAINT "org_teams_ownerOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "org_teams" DROP CONSTRAINT "org_teams_ownerTeamId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_modules" DROP CONSTRAINT "rbac_modules_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_modules" DROP CONSTRAINT "rbac_modules_ownerOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_modules" DROP CONSTRAINT "rbac_modules_ownerTeamId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_role_assignments" DROP CONSTRAINT "rbac_role_assignments_targetOrgId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_roles" DROP CONSTRAINT "rbac_roles_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_roles" DROP CONSTRAINT "rbac_roles_ownerOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "rbac_roles" DROP CONSTRAINT "rbac_roles_ownerTeamId_fkey";

-- DropIndex
DROP INDEX "document_ownerId_idx";

-- DropIndex
DROP INDEX "document_ownerOrganizationId_idx";

-- DropIndex
DROP INDEX "document_ownerTeamId_idx";

-- DropIndex
DROP INDEX "rbac_role_assignments_roleId_targetOrgId_organizationId_key";

-- DropIndex
DROP INDEX "rbac_role_assignments_targetOrgId_idx";

-- AlterTable
ALTER TABLE "document" DROP COLUMN "ownerId",
DROP COLUMN "ownerOrganizationId",
DROP COLUMN "ownerTeamId";

-- AlterTable
ALTER TABLE "org_teams" DROP COLUMN "ownerId",
DROP COLUMN "ownerOrganizationId",
DROP COLUMN "ownerTeamId";

-- AlterTable
ALTER TABLE "rbac_modules" DROP COLUMN "ownerId",
DROP COLUMN "ownerOrganizationId",
DROP COLUMN "ownerTeamId";

-- AlterTable
ALTER TABLE "rbac_role_assignments" DROP COLUMN "targetOrgId";

-- AlterTable
ALTER TABLE "rbac_roles" DROP COLUMN "ownerId",
DROP COLUMN "ownerOrganizationId",
DROP COLUMN "ownerTeamId";
