-- Consolidate drift fixes and image_url addition

-- AlterTable for Events
ALTER TABLE "Events" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR;

-- AlterTable for Bookings - make certain fields nullable
ALTER TABLE "Bookings" ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "total_price" DROP NOT NULL,
ALTER COLUMN "discount_amount" DROP NOT NULL,
ALTER COLUMN "points_used" DROP NOT NULL,
ALTER COLUMN "final_price" DROP NOT NULL;

-- AlterTable for Payments
ALTER TABLE "Payments" ALTER COLUMN "amount" DROP NOT NULL;

-- AlterTable for Promotions - fix promotion_code type and discount_amount
ALTER TABLE "Promotions" ALTER COLUMN "discount_amount" DROP NOT NULL;
