/*
  Warnings:

  - The values [REFERRAL,EVENT_VOUCHER] on the enum `PromoType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `display_id` on the `Bookings` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(20)`.
  - You are about to alter the column `title` on the `Events` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(100)`.
  - You are about to alter the column `promotion_code` on the `Promotions` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(30)`.
  - You are about to alter the column `full_name` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(40)`.
  - Added the required column `name` to the `Promotions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PromoType_new" AS ENUM ('FLASH_SALE', 'VOUCHER', 'BUNDLE', 'LAINNYA');
ALTER TABLE "Promotions" ALTER COLUMN "type" TYPE "PromoType_new" USING ("type"::text::"PromoType_new");
ALTER TYPE "PromoType" RENAME TO "PromoType_old";
ALTER TYPE "PromoType_new" RENAME TO "PromoType";
DROP TYPE "public"."PromoType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Bookings" ALTER COLUMN "display_id" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "Events" ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "location" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Promotions" ADD COLUMN     "name" VARCHAR(50) NOT NULL,
ALTER COLUMN "promotion_code" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "full_name" SET DATA TYPE VARCHAR(40);
