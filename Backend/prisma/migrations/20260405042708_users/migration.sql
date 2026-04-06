-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('CUSTOMERS', 'ORGANIZER');

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" VARCHAR NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" VARCHAR NOT NULL,
    "address" TEXT NOT NULL,
    "role" "Roles"[],
    "referral_code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_referral_code_key" ON "Users"("referral_code");
