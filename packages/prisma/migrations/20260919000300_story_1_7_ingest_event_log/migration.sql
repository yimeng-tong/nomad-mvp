BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Legacy jobs remain unadopted and are never automatically dispatched by this additive migration.
ALTER TABLE "IngestJob"
 ADD COLUMN event_stream_id UUID,
 ADD COLUMN last_event_seq BIGINT NOT NULL DEFAULT 0,
 ADD COLUMN replay_floor_seq BIGINT NOT NULL DEFAULT 0,
 ADD COLUMN execution_pending BOOLEAN NOT NULL DEFAULT FALSE,
 ADD COLUMN lease_owner UUID,
 ADD COLUMN lease_fence BIGINT NOT NULL DEFAULT 0,
 ADD COLUMN lease_expires_at TIMESTAMPTZ(3),
 ADD COLUMN next_execution_at TIMESTAMPTZ(3),
 ADD COLUMN execution_failure_count INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN checkpoint_version INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN checkpoint_json JSONB;
CREATE UNIQUE INDEX "IngestJob_event_stream_id_key" ON "IngestJob"(event_stream_id);
CREATE INDEX "IngestJob_execution_due_idx" ON "IngestJob"(execution_pending,next_execution_at,lease_expires_at);
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_log_bounds_check" CHECK (last_event_seq >= 0 AND replay_floor_seq >= 0 AND replay_floor_seq <= last_event_seq),
 ADD CONSTRAINT "IngestJob_execution_bounds_check" CHECK (lease_fence >= 0 AND execution_failure_count >= 0 AND checkpoint_version >= 0),
 ADD CONSTRAINT "IngestJob_lease_pair_check" CHECK ((lease_owner IS NULL) = (lease_expires_at IS NULL));
CREATE TABLE "IngestEventRecord" (
 job_id UUID NOT NULL REFERENCES "IngestJob"(id) ON DELETE CASCADE,
 seq BIGINT NOT NULL CHECK (seq > 0),
 schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version=1),
 kind TEXT NOT NULL CHECK (kind IN ('fact','checkpoint')),
 attempt INTEGER NOT NULL CHECK (attempt > 0),
 state_version INTEGER NOT NULL CHECK (state_version >= 0),
 stage "IngestStatus" NOT NULL,
 sub_stage TEXT CHECK (sub_stage IN ('media_prep','speech_detect','frame_extract','asr','multimodal')),
 trace_id TEXT NOT NULL,
 occurred_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 snapshot_json JSONB NOT NULL,
 PRIMARY KEY (job_id,seq)
);
-- Corrections append a new fact; neither a retry nor a later snapshot may rewrite an earlier event.
CREATE FUNCTION reject_ingest_event_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'INGEST_EVENT_IMMUTABLE'; END;
$$;
CREATE TRIGGER "IngestEventRecord_no_update" BEFORE UPDATE ON "IngestEventRecord"
 FOR EACH ROW EXECUTE FUNCTION reject_ingest_event_update();
COMMIT;
