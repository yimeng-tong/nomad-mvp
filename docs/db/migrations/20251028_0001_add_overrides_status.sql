-- Migration: add overrides & status_checked to plan_slots; add hotel_poi_id to plan_days
-- Postgres version

BEGIN;

-- Safe guards
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_days' AND column_name='hotel_poi_id') THEN
    ALTER TABLE plan_days ADD COLUMN hotel_poi_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_slots' AND column_name='status_checked') THEN
    ALTER TABLE plan_slots ADD COLUMN status_checked BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_slots' AND column_name='overrides') THEN
    ALTER TABLE plan_slots ADD COLUMN overrides JSONB;
  END IF;
END $$;

COMMIT;

-- Rollback
-- BEGIN;
-- ALTER TABLE plan_slots DROP COLUMN IF EXISTS overrides;
-- ALTER TABLE plan_slots DROP COLUMN IF EXISTS status_checked;
-- ALTER TABLE plan_days  DROP COLUMN IF EXISTS hotel_poi_id;
-- COMMIT;


