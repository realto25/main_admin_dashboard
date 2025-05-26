/*
  Warnings:

  - Added the required column `description` to the `Plot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plot" ADD COLUMN "description" TEXT;
UPDATE "Plot" SET "description" = 'No description available' WHERE "description" IS NULL;
ALTER TABLE "Plot" ALTER COLUMN "description" SET NOT NULL;
