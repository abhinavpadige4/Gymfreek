-- Additive migration: shared admin-uploaded technique photos keyed by
-- exercise name. New table only, no change to existing tables.

-- CreateTable
CREATE TABLE "ExerciseMediaUpload" (
    "name" TEXT NOT NULL,
    "imageData" BYTEA NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseMediaUpload_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseMediaUpload_name_key" ON "ExerciseMediaUpload"("name");
