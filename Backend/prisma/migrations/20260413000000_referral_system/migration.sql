-- ============================================================
-- Referral System Migration
-- ============================================================

-- 1. Make event_id nullable on Promotions (for global/referral coupons)
ALTER TABLE "Promotions" ALTER COLUMN "event_id" DROP NOT NULL;

-- 2. Add recipient_user_id (which user this coupon was issued to)
ALTER TABLE "Promotions" ADD COLUMN "recipient_user_id" TEXT;
ALTER TABLE "Promotions" ADD CONSTRAINT "Promotions_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Add REFERRAL to PromoType enum
ALTER TYPE "PromoType" ADD VALUE IF NOT EXISTS 'REFERRAL';

-- 4. Replace old unique index with conditional indexes
DROP INDEX IF EXISTS "Promotions_event_id_promotion_code_key";

-- Unique promotion_code per event (when event_id is set)
CREATE UNIQUE INDEX "Promotions_event_id_promotion_code_key"
  ON "Promotions"("event_id", "promotion_code")
  WHERE "event_id" IS NOT NULL;

-- Unique promotion_code globally for coupons with no event (referral coupons)
CREATE UNIQUE INDEX "Promotions_global_promotion_code_key"
  ON "Promotions"("promotion_code")
  WHERE "event_id" IS NULL;
