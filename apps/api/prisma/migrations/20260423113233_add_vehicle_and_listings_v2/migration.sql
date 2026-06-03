/*
  Warnings:

  - You are about to drop the column `price` on the `listings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vehicle_id]` on the table `listings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `vehicle_id` to the `listings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('EXTERIOR', 'INTERIOR', 'ENGINE', 'DAMAGE', 'OTHER');

-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "price",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "duplicate_of_id" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "favorites_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "sold_at" TIMESTAMP(3),
ADD COLUMN     "vehicle_id" TEXT NOT NULL,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "year_fab_id" TEXT NOT NULL,
    "available_parts" JSONB NOT NULL DEFAULT '[]',
    "plate" VARCHAR(20),
    "color" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "observations" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_photos" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "PhotoType" NOT NULL DEFAULT 'EXTERIOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_seller_id_status_idx" ON "vehicles"("seller_id", "status");

-- CreateIndex
CREATE INDEX "vehicles_city_state_idx" ON "vehicles"("city", "state");

-- CreateIndex
CREATE INDEX "vehicles_version_id_idx" ON "vehicles"("version_id");

-- CreateIndex
CREATE INDEX "vehicle_photos_vehicle_id_idx" ON "vehicle_photos"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "listings_vehicle_id_key" ON "listings"("vehicle_id");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "vehicle_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_year_fab_id_fkey" FOREIGN KEY ("year_fab_id") REFERENCES "vehicle_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
