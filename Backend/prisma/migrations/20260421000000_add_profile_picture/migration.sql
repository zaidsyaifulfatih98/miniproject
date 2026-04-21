-- Add profile_picture column to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "profile_picture" TEXT;
