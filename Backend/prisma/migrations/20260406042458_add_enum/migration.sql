/*
  Warnings:

  - The values [CONFIRMED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PUBLISHED] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [WAITING_CONFIRMATION,CONFIRMED,REJECTED,CANCELLED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DISCOUNT,VOUCHER] on the enum `PromoType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PAID] on the enum `TicketType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'WAITING_FOR_PAYMENTS', 'WAITING_FOR_CONFIRMATION', 'REJECTED', 'DONE', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."Bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "Bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Events" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Events" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "public"."EventStatus_old";
ALTER TABLE "Events" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
ALTER TABLE "public"."Payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PromoType_new" AS ENUM ('REFERRAL', 'EVENT_VOUCHER');
ALTER TABLE "Promotions" ALTER COLUMN "type" TYPE "PromoType_new" USING ("type"::text::"PromoType_new");
ALTER TYPE "PromoType" RENAME TO "PromoType_old";
ALTER TYPE "PromoType_new" RENAME TO "PromoType";
DROP TYPE "public"."PromoType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TicketType_new" AS ENUM ('FREE', 'EARLY_BIRD', 'REGULAR', 'VIP', 'VVIP');
ALTER TABLE "Tickets" ALTER COLUMN "type" TYPE "TicketType_new" USING ("type"::text::"TicketType_new");
ALTER TYPE "TicketType" RENAME TO "TicketType_old";
ALTER TYPE "TicketType_new" RENAME TO "TicketType";
DROP TYPE "public"."TicketType_old";
COMMIT;
