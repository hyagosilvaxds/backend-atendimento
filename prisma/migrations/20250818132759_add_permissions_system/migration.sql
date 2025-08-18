-- CreateEnum
CREATE TYPE "public"."PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE');

-- CreateEnum
CREATE TYPE "public"."PermissionResource" AS ENUM ('SESSIONS', 'CONTACTS', 'MESSAGES', 'ORG_SETTINGS', 'ORG_USERS', 'REPORTS', 'INTEGRATIONS', 'WEBHOOKS', 'AUTOMATIONS', 'TAGS', 'DEPARTMENTS', 'QUEUES');

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "action" "public"."PermissionAction" NOT NULL,
    "resource" "public"."PermissionResource" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_resource_key" ON "public"."permissions"("action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_organizationId_key" ON "public"."role_permissions"("role", "permissionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "public"."user_permissions"("userId", "permissionId");

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
