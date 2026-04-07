/*
  Warnings:

  - You are about to drop the column `organizer_id` on the `Events` table. All the data in the column will be lost.
  - Added the required column `users_id` to the `Events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_organizer_id_fkey";

-- AlterTable
ALTER TABLE "Events" DROP COLUMN "organizer_id",
ADD COLUMN     "users_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
