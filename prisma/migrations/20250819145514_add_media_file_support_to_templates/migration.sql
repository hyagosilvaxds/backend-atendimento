-- AlterTable
ALTER TABLE "public"."warmup_message_templates" ADD COLUMN     "mediaFileId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."warmup_message_templates" ADD CONSTRAINT "warmup_message_templates_mediaFileId_fkey" FOREIGN KEY ("mediaFileId") REFERENCES "public"."warmup_media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
