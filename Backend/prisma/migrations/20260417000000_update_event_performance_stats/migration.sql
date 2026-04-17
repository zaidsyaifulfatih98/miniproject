-- Migrate EventPerformanceStats: replace total_views with detail_views, checkout_views, finalized_views
-- Add defaults and updatedAt to all existing columns

ALTER TABLE "EventPerformanceStats"
  RENAME COLUMN "total_views" TO "detail_views";

ALTER TABLE "EventPerformanceStats"
  ADD COLUMN IF NOT EXISTS "checkout_views"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "finalized_views"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "EventPerformanceStats"
  ALTER COLUMN "detail_views"        SET DEFAULT 0,
  ALTER COLUMN "tickets_sold"        SET DEFAULT 0,
  ALTER COLUMN "revenue_gross"       SET DEFAULT 0,
  ALTER COLUMN "revenue_net"         SET DEFAULT 0,
  ALTER COLUMN "referral_conversion" SET DEFAULT 0;
