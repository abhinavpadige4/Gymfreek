/*
  Warnings:

  - The primary key for the `ExerciseMediaUpload` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ExerciseMediaUpload" DROP CONSTRAINT "ExerciseMediaUpload_pkey";

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "sourceTemplateSlug" TEXT;
