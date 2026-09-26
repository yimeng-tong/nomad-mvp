BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Stage 2 is allowed only after every active row has the copied key and the
-- replacement unique index is valid. Tombstones will retain the immutable
-- normalized URL while clearing only their active key.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "ImportRecord" WHERE "deleted_at" IS NULL
    AND ("active_normalized_url" IS NULL OR "active_normalized_url" <> "normalized_url"))
  THEN RAISE EXCEPTION 'active ImportRecord identity preflight failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
    WHERE i.indrelid='"ImportRecord"'::regclass
      AND c.relname='ImportRecord_userId_active_normalized_url_key' AND i.indisunique AND i.indisvalid)
  THEN RAISE EXCEPTION 'active ImportRecord unique index missing'; END IF;
END $$;

DROP INDEX "ImportRecord_userId_normalized_url_key";

COMMIT;
