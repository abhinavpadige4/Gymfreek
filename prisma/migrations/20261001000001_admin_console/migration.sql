-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "refundId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "refundNote" TEXT;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
