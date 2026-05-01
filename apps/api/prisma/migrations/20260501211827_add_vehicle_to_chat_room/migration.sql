/*
  Warnings:

  - A unique constraint covering the columns `[buyer_id,vehicle_id]` on the table `chat_rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "vehicle_id" TEXT,
ALTER COLUMN "listing_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "chat_rooms_vehicle_id_idx" ON "chat_rooms"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_buyer_id_vehicle_id_key" ON "chat_rooms"("buyer_id", "vehicle_id");

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
