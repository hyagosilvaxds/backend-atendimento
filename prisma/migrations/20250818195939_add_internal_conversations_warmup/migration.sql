/*
  Warnings:

  - You are about to drop the column `sessionId` on the `warmup_executions` table. All the data in the column will be lost.
  - Added the required column `fromSessionId` to the `warmup_executions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."warmup_executions" DROP CONSTRAINT "warmup_executions_sessionId_fkey";

-- AlterTable
ALTER TABLE "public"."warmup_campaigns" ADD COLUMN     "enableInternalConversations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "internalConversationRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
ADD COLUMN     "minSessionsForInternal" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "public"."warmup_executions" DROP COLUMN "sessionId",
ADD COLUMN     "executionType" TEXT NOT NULL DEFAULT 'external',
ADD COLUMN     "fromSessionId" TEXT NOT NULL,
ADD COLUMN     "toSessionId" TEXT,
ALTER COLUMN "contactId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_fromSessionId_fkey" FOREIGN KEY ("fromSessionId") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_toSessionId_fkey" FOREIGN KEY ("toSessionId") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
