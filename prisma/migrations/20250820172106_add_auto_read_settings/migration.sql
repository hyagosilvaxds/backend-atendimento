-- AlterTable
ALTER TABLE "public"."whatsapp_sessions" ADD COLUMN     "autoReadEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoReadInterval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "autoReadMaxDelay" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "autoReadMinDelay" INTEGER NOT NULL DEFAULT 5;
