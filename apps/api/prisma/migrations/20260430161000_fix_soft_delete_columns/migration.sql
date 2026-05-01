-- Fix missing soft delete columns
-- Added at: 2026-04-30

-- AlterTable users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
    ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);
  END IF;
END $$;

-- AlterTable seller_profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_profiles' AND column_name='deleted_at') THEN
    ALTER TABLE "seller_profiles" ADD COLUMN "deleted_at" TIMESTAMP(3);
  END IF;
END $$;

-- AlterTable vehicles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='deleted_at') THEN
    ALTER TABLE "vehicles" ADD COLUMN "deleted_at" TIMESTAMP(3);
  END IF;
END $$;

-- AlterTable listings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='deleted_at') THEN
    ALTER TABLE "listings" ADD COLUMN "deleted_at" TIMESTAMP(3);
  END IF;
END $$;

-- AlterTable buyer_profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buyer_profile' AND column_name='deleted_at') THEN
    ALTER TABLE "buyer_profile" ADD COLUMN "deleted_at" TIMESTAMP(3);
  END IF;
END $$;
