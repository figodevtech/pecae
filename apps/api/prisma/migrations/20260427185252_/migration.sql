-- AlterTable
ALTER TABLE "ad_campaigns" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chat_rooms" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN     "push_token" TEXT;

-- AlterTable
ALTER TABLE "seller_stats" ADD COLUMN     "total_chats_initiated" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
