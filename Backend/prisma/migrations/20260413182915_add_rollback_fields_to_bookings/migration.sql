-- Capture existing changes in database
-- This migration records changes that were already applied to the database

-- AlterTable for Bookings
ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "buyer_email" VARCHAR,
ADD COLUMN IF NOT EXISTS "buyer_name" VARCHAR,
ADD COLUMN IF NOT EXISTS "buyer_phone" VARCHAR;

-- AlterTable for Events
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR;

-- AlterTable for Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "profile_picture" VARCHAR;

-- AlterTable for Payments
-- Column amount is already nullable in database

-- AlterTable for Promotions
-- Foreign key and other changes already exist
