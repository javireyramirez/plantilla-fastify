/*
  Warnings:

  - You are about to drop the column `accessTokenExpiry` on the `auth_accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth_accounts" DROP COLUMN "accessTokenExpiry",
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "scope" TEXT;
