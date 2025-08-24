-- CreateEnum
CREATE TYPE "public"."WhatsAppSessionStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'QR_CODE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."WhatsAppSessionType" AS ENUM ('MAIN', 'SUPPORT', 'SALES', 'MARKETING');

-- AlterEnum
ALTER TYPE "public"."PermissionResource" ADD VALUE 'WHATSAPP_SESSIONS';

-- CreateTable
CREATE TABLE "public"."whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phone" TEXT,
    "qrCode" TEXT,
    "status" "public"."WhatsAppSessionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "type" "public"."WhatsAppSessionType" NOT NULL DEFAULT 'MAIN',
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastConnectedAt" TIMESTAMP(3),
    "lastDisconnectedAt" TIMESTAMP(3),
    "authData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_messages" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_sessionId_key" ON "public"."whatsapp_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_messageId_key" ON "public"."whatsapp_messages"("messageId");

-- AddForeignKey
ALTER TABLE "public"."whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
