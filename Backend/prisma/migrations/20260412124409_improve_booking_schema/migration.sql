-- AlterTable: improve_booking_schema (baseline - applied directly to DB)
ALTER TABLE "Bookings" ALTER COLUMN "quantity" SET NOT NULL,
                       ALTER COLUMN "quantity" SET DEFAULT 1,
                       ALTER COLUMN "total_price" SET NOT NULL,
                       ALTER COLUMN "total_price" SET DEFAULT 0,
                       ALTER COLUMN "discount_amount" SET NOT NULL,
                       ALTER COLUMN "discount_amount" SET DEFAULT 0,
                       ALTER COLUMN "points_used" SET NOT NULL,
                       ALTER COLUMN "points_used" SET DEFAULT 0,
                       ALTER COLUMN "final_price" SET NOT NULL,
                       ALTER COLUMN "final_price" SET DEFAULT 0;

ALTER TABLE "Payments" ALTER COLUMN "amount" SET NOT NULL,
                       ALTER COLUMN "amount" SET DEFAULT 0;

ALTER TABLE "Promotions" ALTER COLUMN "discount_amount" SET DEFAULT 0,
                         ALTER COLUMN "used_count" SET NOT NULL,
                         ALTER COLUMN "used_count" SET DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "Promotions_event_id_promotion_code_key" ON "Promotions"("event_id", "promotion_code");
