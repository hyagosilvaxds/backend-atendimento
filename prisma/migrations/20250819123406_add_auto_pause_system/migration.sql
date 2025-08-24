-- AlterTable
ALTER TABLE "public"."warmup_campaign_sessions" ADD COLUMN     "conversationStartedAt" TIMESTAMP(3),
ADD COLUMN     "currentPauseUntil" TIMESTAMP(3),
ADD COLUMN     "lastConversationStart" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."warmup_campaigns" ADD COLUMN     "enableAutoPauses" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxPauseTimeMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "minConversationTimeMinutes" INTEGER NOT NULL DEFAULT 20;
