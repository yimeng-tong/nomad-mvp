-- Prisma migration example (SQL) for MVP fields
-- If using Prisma Migrate, translate to a Prisma schema diff accordingly

-- Up
ALTER TABLE plan_days ADD COLUMN IF NOT EXISTS hotel_poi_id TEXT;
ALTER TABLE plan_slots ADD COLUMN IF NOT EXISTS status_checked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE plan_slots ADD COLUMN IF NOT EXISTS overrides JSONB;

-- Down
-- ALTER TABLE plan_slots DROP COLUMN IF EXISTS overrides;
-- ALTER TABLE plan_slots DROP COLUMN IF EXISTS status_checked;
-- ALTER TABLE plan_days  DROP COLUMN IF EXISTS hotel_poi_id;


