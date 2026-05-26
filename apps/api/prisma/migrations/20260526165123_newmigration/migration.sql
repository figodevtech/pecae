/*
  Warnings:

  - The values [COMPLETED] on the enum `AdCampaignStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `listings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `seller_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('ios', 'android', 'web');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('CPM', 'CPC', 'FLAT_PERIOD');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('FRAUD', 'INAPPROPRIATE_CONTENT', 'MISLEADING_INFO', 'ABUSIVE_BEHAVIOR', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "AdCampaignStatus_new" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'PENDING_PAYMENT', 'CANCELLED');
ALTER TABLE "ad_campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ad_campaigns" ALTER COLUMN "status" TYPE "AdCampaignStatus_new" USING ("status"::text::"AdCampaignStatus_new");
ALTER TYPE "AdCampaignStatus" RENAME TO "AdCampaignStatus_old";
ALTER TYPE "AdCampaignStatus_new" RENAME TO "AdCampaignStatus";
DROP TYPE "AdCampaignStatus_old";
ALTER TABLE "ad_campaigns" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_SOLD';

-- AlterTable
ALTER TABLE "ad_campaigns" ADD COLUMN     "budget_type" "BudgetType" NOT NULL DEFAULT 'CPC',
ADD COLUMN     "external_payment_id" TEXT,
ADD COLUMN     "max_impress_cap" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "target_brand_id" TEXT,
ADD COLUMN     "target_city" TEXT,
ADD COLUMN     "target_model_id" TEXT,
ADD COLUMN     "target_state" TEXT,
ADD COLUMN     "target_year" INTEGER;

-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN     "badges" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "delivery_radius" INTEGER,
ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "stripe_customer_id" TEXT;

-- AlterTable
ALTER TABLE "seller_stats" ADD COLUMN     "avg_time_to_sell_minutes" INTEGER;

-- AlterTable
ALTER TABLE "vehicle_photos" ADD COLUMN     "blurhash" TEXT;

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_catalog" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reporter_id" TEXT NOT NULL,
    "reported_id" TEXT,
    "listing_id" TEXT,
    "chat_room_id" TEXT,
    "moderator_id" TEXT,
    "moderator_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VehicleParts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_user_id_platform_key" ON "push_tokens"("user_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "part_catalog_slug_key" ON "part_catalog"("slug");

-- CreateIndex
CREATE INDEX "part_catalog_category_id_idx" ON "part_catalog"("category_id");

-- CreateIndex
CREATE INDEX "part_catalog_slug_idx" ON "part_catalog"("slug");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- CreateIndex
CREATE UNIQUE INDEX "_VehicleParts_AB_unique" ON "_VehicleParts"("A", "B");

-- CreateIndex
CREATE INDEX "_VehicleParts_B_index" ON "_VehicleParts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_stripe_customer_id_key" ON "seller_profiles"("stripe_customer_id");

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_catalog" ADD CONSTRAINT "part_catalog_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "part_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_target_brand_id_fkey" FOREIGN KEY ("target_brand_id") REFERENCES "vehicle_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_target_model_id_fkey" FOREIGN KEY ("target_model_id") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VehicleParts" ADD CONSTRAINT "_VehicleParts_A_fkey" FOREIGN KEY ("A") REFERENCES "part_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VehicleParts" ADD CONSTRAINT "_VehicleParts_B_fkey" FOREIGN KEY ("B") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
