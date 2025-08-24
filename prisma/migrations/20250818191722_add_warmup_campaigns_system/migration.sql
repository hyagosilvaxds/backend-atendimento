-- AlterEnum
ALTER TYPE "public"."PermissionResource" ADD VALUE 'WARMUP_CAMPAIGNS';

-- CreateTable
CREATE TABLE "public"."warmup_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailyMessageGoal" INTEGER NOT NULL DEFAULT 50,
    "minIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxIntervalMinutes" INTEGER NOT NULL DEFAULT 180,
    "workingHourStart" INTEGER NOT NULL DEFAULT 8,
    "workingHourEnd" INTEGER NOT NULL DEFAULT 18,
    "useWorkingHours" BOOLEAN NOT NULL DEFAULT true,
    "allowWeekends" BOOLEAN NOT NULL DEFAULT false,
    "randomizeMessages" BOOLEAN NOT NULL DEFAULT true,
    "randomizeInterval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "warmup_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_campaign_sessions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "dailyMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warmup_campaign_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_campaign_contacts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warmup_campaign_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_message_templates" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warmup_message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_media_files" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warmup_media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_executions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "templateId" TEXT,
    "mediaFileId" TEXT,
    "messageContent" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warmup_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_sent_messages" (
    "id" TEXT NOT NULL,
    "campaignSessionId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "messageId" TEXT,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "responseTime" INTEGER,
    "gotResponse" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "warmup_sent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_health_metrics" (
    "id" TEXT NOT NULL,
    "campaignSessionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesDelivered" INTEGER NOT NULL DEFAULT 0,
    "messagesRead" INTEGER NOT NULL DEFAULT 0,
    "responsesReceived" INTEGER NOT NULL DEFAULT 0,
    "averageMessagesPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warmup_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warmup_campaign_sessions_campaignId_sessionId_key" ON "public"."warmup_campaign_sessions"("campaignId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "warmup_campaign_contacts_campaignId_contactId_key" ON "public"."warmup_campaign_contacts"("campaignId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "warmup_health_metrics_campaignSessionId_date_key" ON "public"."warmup_health_metrics"("campaignSessionId", "date");

-- AddForeignKey
ALTER TABLE "public"."warmup_campaigns" ADD CONSTRAINT "warmup_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_campaigns" ADD CONSTRAINT "warmup_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_campaign_sessions" ADD CONSTRAINT "warmup_campaign_sessions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."warmup_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_campaign_sessions" ADD CONSTRAINT "warmup_campaign_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_campaign_contacts" ADD CONSTRAINT "warmup_campaign_contacts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."warmup_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_campaign_contacts" ADD CONSTRAINT "warmup_campaign_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_message_templates" ADD CONSTRAINT "warmup_message_templates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."warmup_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_media_files" ADD CONSTRAINT "warmup_media_files_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."warmup_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."warmup_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."warmup_message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_executions" ADD CONSTRAINT "warmup_executions_mediaFileId_fkey" FOREIGN KEY ("mediaFileId") REFERENCES "public"."warmup_media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_sent_messages" ADD CONSTRAINT "warmup_sent_messages_campaignSessionId_fkey" FOREIGN KEY ("campaignSessionId") REFERENCES "public"."warmup_campaign_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_sent_messages" ADD CONSTRAINT "warmup_sent_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_health_metrics" ADD CONSTRAINT "warmup_health_metrics_campaignSessionId_fkey" FOREIGN KEY ("campaignSessionId") REFERENCES "public"."warmup_campaign_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
