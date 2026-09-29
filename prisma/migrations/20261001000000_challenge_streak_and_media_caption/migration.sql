-- Additive: streak tracking on enrollments, admin caption on shared media.
-- Nullable/defaulted columns only; history rows are never deleted.

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "lastCompletedAt" TIMESTAMPTZ(6), ADD COLUMN "streakCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ExerciseMediaUpload" ADD COLUMN "caption" TEXT;

