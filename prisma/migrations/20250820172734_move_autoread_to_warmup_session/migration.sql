/*
  Warnings:

  - You are about to drop the column `autoReadEnabled` on the `whatsapp_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `autoReadInterval` on the `whatsapp_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `autoReadMaxDelay` on the `whatsapp_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `autoReadMinDelay` on the `whatsapp_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."warmup_campaign_sessions" ADD COLUMN     "autoReadEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoReadInterval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "autoReadMaxDelay" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "autoReadMinDelay" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "public"."whatsapp_sessions" DROP COLUMN "autoReadEnabled",
DROP COLUMN "autoReadInterval",
DROP COLUMN "autoReadMaxDelay",
DROP COLUMN "autoReadMinDelay";
