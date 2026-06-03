-- CreateEnum
CREATE TYPE "VehicleSegment" AS ENUM ('HATCH', 'SEDAN', 'SUV', 'PICKUP', 'VAN', 'TRUCK', 'MOTORCYCLE', 'OTHER');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'AUTOMATED');

-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN     "zip_code" VARCHAR(10);

-- CreateTable
CREATE TABLE "vehicle_brands" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100),
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "segment" "VehicleSegment" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_versions" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "engine_code" VARCHAR(50),
    "displacement" DECIMAL(3,1),
    "fuel" "FuelType" NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_years" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "year_fab" INTEGER NOT NULL,
    "year_model" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_years_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_name_key" ON "vehicle_brands"("name");

-- CreateIndex
CREATE INDEX "vehicle_models_brand_id_idx" ON "vehicle_models"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_brand_id_name_key" ON "vehicle_models"("brand_id", "name");

-- CreateIndex
CREATE INDEX "vehicle_versions_model_id_idx" ON "vehicle_versions"("model_id");

-- CreateIndex
CREATE INDEX "vehicle_years_version_id_idx" ON "vehicle_years"("version_id");

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "vehicle_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_years" ADD CONSTRAINT "vehicle_years_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "vehicle_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
