-- AlterTable
ALTER TABLE "User" ADD COLUMN "termsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "privacyVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "consentedAt" TIMESTAMPTZ(6);
