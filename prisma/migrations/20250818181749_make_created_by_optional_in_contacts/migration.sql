-- DropForeignKey
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_createdById_fkey";

-- AlterTable
ALTER TABLE "public"."contacts" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
