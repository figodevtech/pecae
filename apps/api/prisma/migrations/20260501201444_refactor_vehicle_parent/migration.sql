-- DropIndex
DROP INDEX "listings_vehicle_id_key";

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "price" DOUBLE PRECISION;
