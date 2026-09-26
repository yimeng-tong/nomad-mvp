BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Additive only. Existing jobs and inspirations are preserved; their owner-safe
-- record backfill requires a separate conflict and key preflight.
ALTER TABLE "Inspiration" ADD COLUMN "import_record_id" UUID;

CREATE TABLE "ImportRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "normalized_url" VARCHAR(2048) NOT NULL,
    "normalization_version" VARCHAR(48) NOT NULL,
    "original_url_protected" JSONB NOT NULL,
    "source_title" VARCHAR(240),
    "status" "IngestStatus" NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ImportRecord_normalized_url_check" CHECK (length("normalized_url") > 0 AND length("normalization_version") > 0),
    CONSTRAINT "ImportRecord_protected_url_check" CHECK (
      jsonb_typeof("original_url_protected") = 'object'
      AND "original_url_protected"->>'version' = '1'
      AND "original_url_protected" ? 'key_id'
      AND "original_url_protected" ? 'iv'
      AND "original_url_protected" ? 'tag'
      AND "original_url_protected" ? 'ciphertext'
    )
);

CREATE INDEX "ImportRecord_owner_created_idx" ON "ImportRecord"("userId", "created_at", "id");
CREATE UNIQUE INDEX "ImportRecord_userId_normalized_url_key" ON "ImportRecord"("userId", "normalized_url");
CREATE UNIQUE INDEX "ImportRecord_job_id_userId_key" ON "ImportRecord"("job_id", "userId");
CREATE UNIQUE INDEX "ImportRecord_id_userId_key" ON "ImportRecord"("id", "userId");
CREATE UNIQUE INDEX "IngestJob_id_userId_key" ON "IngestJob"("id", "userId");

ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_job_id_userId_fkey"
  FOREIGN KEY ("job_id", "userId") REFERENCES "IngestJob"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspiration" ADD CONSTRAINT "Inspiration_import_record_id_userId_fkey"
  FOREIGN KEY ("import_record_id", "userId") REFERENCES "ImportRecord"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
