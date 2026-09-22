-- Additive migration: a KETTLEBELL equipment type for the 100XU blueprint
-- catalog (swings, carries, cleans, snatches). Enum value only, no table or
-- data change.

-- AlterEnum
ALTER TYPE "EquipmentType" ADD VALUE 'KETTLEBELL';
