-- Migration to enable Full-Text Search optimized indexes in PostgreSQL
-- This should be run after npx prisma migrate dev

-- Create extension if not exists (usually it is enabled by default in modern Postgres)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for Full-Text Search
CREATE INDEX IF NOT EXISTS listings_title_fts_idx ON "listings" USING GIN (to_tsvector('portuguese', "title"));
CREATE INDEX IF NOT EXISTS listings_description_fts_idx ON "listings" USING GIN (to_tsvector('portuguese', "description"));
CREATE INDEX IF NOT EXISTS vehicles_observations_fts_idx ON "vehicles" USING GIN (to_tsvector('portuguese', "observations"));
