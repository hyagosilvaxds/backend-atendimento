-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'ORG_USER', 'ORG_VIEWER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateTable
CREATE TABLE "public"."super_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ORG_USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "public"."super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "public"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "public"."password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
