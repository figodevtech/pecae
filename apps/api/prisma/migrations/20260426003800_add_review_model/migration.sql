-- AlterTable
ALTER TABLE "seller_stats" ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "total_reviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "seller_profile_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "chat_room_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "is_removed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_chat_room_id_key" ON "reviews"("chat_room_id");

-- CreateIndex
CREATE INDEX "reviews_seller_profile_id_idx" ON "reviews"("seller_profile_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "reviews" ADD CONSTRAINT "chk_rating" CHECK (rating BETWEEN 1 AND 5);

