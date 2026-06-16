-- nomad-mvp DB Schema (MVP v0.3-light)
-- Purpose: capture minimal tables and new fields required by ResultSheet overrides and status_checked

-- Users simplified
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans and days
CREATE TABLE IF NOT EXISTS plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  city             TEXT NOT NULL,
  start_date       DATE NOT NULL,
  days             INT  NOT NULL CHECK (days > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_days (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_index        INT  NOT NULL CHECK (day_index >= 1),
  hotel_poi_id     TEXT, -- display-only linkage to a canonical POI id
  UNIQUE (plan_id, day_index)
);

-- Slots: activity timeline (2h granularity)
CREATE TYPE slot_type AS ENUM ('activity','dining','nightlife','transport','hotel');

CREATE TABLE IF NOT EXISTS plan_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id      UUID NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  type             slot_type NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  title            TEXT NOT NULL,
  conflict_type    TEXT, -- closed/too_far/overtime/open_gap_short
  status_checked   BOOLEAN NOT NULL DEFAULT false, -- for ResultSheet check-in
  overrides        JSONB, -- { do, prepare, notice } from light edit (slot-level)
  rev              INT NOT NULL DEFAULT 1,
  locked_at        TIMESTAMPTZ,
  is_locked        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_plan_slots_day ON plan_slots(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_plan_slots_type ON plan_slots(type);
CREATE INDEX IF NOT EXISTS idx_plan_slots_conflict ON plan_slots(conflict_type);

-- Helper view: result_sheet_slots (optional materialization hint)
-- SELECT ps.id AS slot_id, pd.day_index AS day, ps.type, ps.start_time, ps.end_time,
--        ps.title, ps.status_checked,
--        COALESCE(ps.overrides->>'do', NULL) AS do,
--        COALESCE(ps.overrides->>'prepare', NULL) AS prepare,
--        COALESCE(ps.overrides->>'notice', NULL) AS notice
-- FROM plan_slots ps JOIN plan_days pd ON ps.plan_day_id = pd.id;

-- nomad-mvp Postgres schema (v1.0)
-- Requires: postgis, pgcrypto (for gen_random_uuid), vector (pgvector)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- fallback if gen_random_uuid not available
-- Uncomment if pgvector installed as 'vector'
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
DO $$ BEGIN
  CREATE TYPE ingest_status AS ENUM ('created','fetching','parsing','geo','storing','done','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_pace AS ENUM ('slow','normal','fast');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE slot_type AS ENUM ('place','free','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conflict_type AS ENUM ('none','closed','too_far','overtime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fill_validation AS ENUM ('ok','too_long','missing_do');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users & Auth
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           text UNIQUE,
  region          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oauth_identities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('apple','wechat')),
  subject         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, subject)
);

CREATE TABLE IF NOT EXISTS sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint text,
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pace_default    plan_pace NOT NULL DEFAULT 'normal',
  start_time_default time NOT NULL DEFAULT '09:00',
  units           text NOT NULL DEFAULT 'metric',
  map_style       text
);

CREATE TABLE IF NOT EXISTS user_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        text NOT NULL DEFAULT 'openai',
  enc_key         bytea NOT NULL, -- envelope-encrypted key material
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Cities & POI
CREATE TABLE IF NOT EXISTS cities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  tz              text NOT NULL DEFAULT 'Asia/Shanghai',
  geom            geography(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS cities_geom_gix ON cities USING GIST (geom);

CREATE TABLE IF NOT EXISTS canonical_poi (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id         uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name            text NOT NULL,
  address         text,
  amap_id         text,
  open_hours_json jsonb,
  geom            geography(Point, 4326) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS canonical_poi_city_idx ON canonical_poi(city_id);
CREATE INDEX IF NOT EXISTS canonical_poi_geom_gix ON canonical_poi USING GIST (geom);

-- Ingest & Inspirations
CREATE TABLE IF NOT EXISTS ingest_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type     text NOT NULL CHECK (source_type IN ('xhs')),
  source_url      text,
  source_hash     text NOT NULL, -- idempotency key
  status          ingest_status NOT NULL DEFAULT 'created',
  retry_count     int NOT NULL DEFAULT 0,
  last_error_code text,
  trace_id        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_hash)
);
CREATE INDEX IF NOT EXISTS ingest_jobs_user_idx ON ingest_jobs(user_id);

CREATE TABLE IF NOT EXISTS inspirations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id          uuid REFERENCES ingest_jobs(id) ON DELETE SET NULL,
  title           text,
  text            text,
  tags            text[],
  canonical_url   text,
  locate_status   text NOT NULL DEFAULT 'pending' CHECK (locate_status IN ('pending','located')),
  poi_id          uuid REFERENCES canonical_poi(id) ON DELETE SET NULL,
  city_id         uuid REFERENCES cities(id) ON DELETE SET NULL,
  source_hash     text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_hash)
);
CREATE INDEX IF NOT EXISTS inspirations_city_idx ON inspirations(city_id);
CREATE INDEX IF NOT EXISTS inspirations_tags_gin ON inspirations USING GIN (tags);

CREATE TABLE IF NOT EXISTS assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id  uuid NOT NULL REFERENCES inspirations(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('image')),
  cos_key         text NOT NULL,
  sha256          text,
  width           int,
  height          int,
  format          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_insp_idx ON assets(inspiration_id);

CREATE TABLE IF NOT EXISTS locate_candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id  uuid NOT NULL REFERENCES inspirations(id) ON DELETE CASCADE,
  rank            int NOT NULL,
  poi_snapshot_json jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inspiration_id, rank)
);

-- Planner & Editing
CREATE TABLE IF NOT EXISTS plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id         uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  tz              text NOT NULL DEFAULT 'Asia/Shanghai',
  start_date      date NOT NULL,
  days            int NOT NULL CHECK (days >= 1),
  pace            plan_pace NOT NULL DEFAULT 'normal',
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','filled')),
  rev             int NOT NULL DEFAULT 1,
  is_locked       boolean NOT NULL DEFAULT false,
  locked_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plans_user_idx ON plans(user_id);
CREATE INDEX IF NOT EXISTS plans_city_idx ON plans(city_id);

CREATE TABLE IF NOT EXISTS plan_days (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_index       int NOT NULL,
  date            date NOT NULL,
  UNIQUE(plan_id, day_index)
);
CREATE INDEX IF NOT EXISTS plan_days_plan_idx ON plan_days(plan_id);

CREATE TABLE IF NOT EXISTS plan_slots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id          uuid NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  slot_index      int NOT NULL,
  start_at        time NOT NULL,
  end_at          time NOT NULL,
  type            slot_type NOT NULL,
  poi_id          uuid REFERENCES canonical_poi(id) ON DELETE SET NULL,
  inspiration_id  uuid REFERENCES inspirations(id) ON DELETE SET NULL,
  notes_json      jsonb,
  conflict        conflict_type NOT NULL DEFAULT 'none',
  applied_fill_run_id uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(day_id, slot_index)
);
CREATE INDEX IF NOT EXISTS plan_slots_day_idx ON plan_slots(day_id);
CREATE INDEX IF NOT EXISTS plan_slots_poi_idx ON plan_slots(poi_id);
CREATE INDEX IF NOT EXISTS plan_slots_insp_idx ON plan_slots(inspiration_id);
CREATE INDEX IF NOT EXISTS plan_slots_notes_gin ON plan_slots USING GIN (notes_json);

CREATE TABLE IF NOT EXISTS edit_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('insert','replace','move','retime','delete','undo')),
  payload_json    jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS edit_events_plan_idx ON edit_events(plan_id);

CREATE TABLE IF NOT EXISTS slot_candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_id          uuid REFERENCES plan_days(id) ON DELETE CASCADE,
  slot_index      int,
  source          text NOT NULL CHECK (source IN ('inspiration','nearby','ai')),
  poi_snapshot_json jsonb NOT NULL,
  reason_short    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS slot_candidates_plan_idx ON slot_candidates(plan_id);

-- AI Fill
CREATE TABLE IF NOT EXISTS fill_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status          text NOT NULL CHECK (status IN ('started','progress','done','error')),
  metrics_json    jsonb,
  trace_id        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fill_runs_plan_idx ON fill_runs(plan_id);

CREATE TABLE IF NOT EXISTS fill_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fill_run_id     uuid NOT NULL REFERENCES fill_runs(id) ON DELETE CASCADE,
  slot_id         uuid NOT NULL REFERENCES plan_slots(id) ON DELETE CASCADE,
  do_text         text[],
  prepare_text    text[],
  notice_text     text[],
  validation_status fill_validation NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fill_items_run_idx ON fill_items(fill_run_id);

-- Export
CREATE TABLE IF NOT EXISTS export_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  width_px        int NOT NULL,
  slice_by_day    boolean NOT NULL DEFAULT true,
  status          text NOT NULL CHECK (status IN ('queued','rendering','done','failed')),
  result_urls     text[],
  format          text CHECK (format IN ('webp','jpeg')),
  fallback_reason text,
  trace_id        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS export_jobs_plan_idx ON export_jobs(plan_id);

-- Observability (optional product-side table; use external analytics if preferred)
CREATE TABLE IF NOT EXISTS app_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  props_json      jsonb,
  ts              timestamptz NOT NULL DEFAULT now(),
  trace_id        text
);
CREATE INDEX IF NOT EXISTS app_events_user_idx ON app_events(user_id);
CREATE INDEX IF NOT EXISTS app_events_ts_idx ON app_events(ts);
CREATE INDEX IF NOT EXISTS app_events_props_gin ON app_events USING GIN (props_json);


