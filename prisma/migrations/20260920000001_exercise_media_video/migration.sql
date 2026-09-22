-- Additive migration: demo video support on shared exercise media uploads.
-- videoUrl holds a YouTube/Vimeo/mp4 link; videoData/videoMimeType hold an
-- uploaded file (capped in application code). Nullable columns only, and the
-- photo columns become nullable so a video-only row is valid.

-- AlterTable
ALTER TABLE "ExerciseMediaUpload" ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "videoData" BYTEA,
ADD COLUMN "videoMimeType" TEXT,
ALTER COLUMN "imageData" DROP NOT NULL,
ALTER COLUMN "imageMimeType" DROP NOT NULL;
