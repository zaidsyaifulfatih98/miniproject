-- AlterTable: Fix Bookings table rollback fields
-- Drop old columns if they exist and recreate with correct names
ALTER TABLE "Bookings" 
DROP COLUMN IF EXISTS "rolled_back",
DROP COLUMN IF EXISTS "rolled_back_at",
ADD COLUMN IF NOT EXISTS "has_rollback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rollback_reason" VARCHAR(255);
