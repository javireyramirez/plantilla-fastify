/*
  Warnings:

  - You are about to drop the column `key` on the `rbac_modules` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `rbac_modules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `rbac_modules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `rbac_modules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `rbac_modules` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "rbac_modules_key_key";

-- AlterTable
ALTER TABLE "rbac_modules" DROP COLUMN "key",
DROP COLUMN "label",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rbac_modules_slug_key" ON "rbac_modules"("slug");
