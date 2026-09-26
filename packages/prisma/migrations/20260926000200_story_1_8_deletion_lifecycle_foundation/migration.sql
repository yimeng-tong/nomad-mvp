BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Stage the owner deletion lifecycle without enabling deletion. The existing
-- unique URL index and protected envelope remain mandatory in this phase.
ALTER TABLE "IngestJob" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);
ALTER TABLE "Inspiration" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);
ALTER TABLE "ImportRecord" ADD COLUMN "active_normalized_url" VARCHAR(2048);
ALTER TABLE "ImportRecord" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);

-- This table was introduced by the immediately preceding migration. Preserve
-- each immutable normalized URL while preparing a separate active-only key.
UPDATE "ImportRecord" SET "active_normalized_url" = "normalized_url";
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_active_url_check" CHECK (
  ("deleted_at" IS NULL AND "active_normalized_url" IS NOT NULL AND "active_normalized_url" = "normalized_url")
  OR ("deleted_at" IS NOT NULL AND "active_normalized_url" IS NULL)
);
CREATE UNIQUE INDEX "ImportRecord_userId_active_normalized_url_key"
  ON "ImportRecord"("userId", "active_normalized_url");

COMMIT;
