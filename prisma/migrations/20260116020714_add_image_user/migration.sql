/*
  Warnings:

  - You are about to drop the column `image` on the `auth_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth_keys" DROP COLUMN "image";

-- AlterTable
ALTER TABLE "auth_users" ADD COLUMN     "image" TEXT;
