BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE "IngestJob" ADD COLUMN state_version INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN snapshot_json JSONB;
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_state_version_check" CHECK (state_version >= 0);
CREATE TABLE "IngestCommand" (
 user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
 operation_id UUID NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('start','retry')),
 request_hash TEXT NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
 job_id UUID NOT NULL REFERENCES "IngestJob"(id) ON DELETE RESTRICT,
 attempt INTEGER NOT NULL CHECK (attempt >= 1),
 disposition TEXT NOT NULL CHECK (disposition IN ('created','reused','retried')),
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (user_id,operation_id)
);
CREATE INDEX "IngestCommand_job_id_idx" ON "IngestCommand"(job_id);
COMMIT;
