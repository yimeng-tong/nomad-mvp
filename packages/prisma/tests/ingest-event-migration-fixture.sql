-- Explicit current-fact baseline for one synthetic predecessor; no fabricated past event history.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM "IngestJob" WHERE event_stream_id IS NOT NULL OR execution_pending OR last_event_seq<>0) THEN
  RAISE EXCEPTION 'Migration adopted or dispatched legacy jobs';
 END IF;
END $$;
BEGIN;
UPDATE "IngestJob" SET event_stream_id='80000000-0000-4000-8000-000000000001',last_event_seq=1
 WHERE id='40000000-0000-4000-8000-000000000002';
INSERT INTO "IngestEventRecord"(job_id,seq,kind,attempt,state_version,stage,trace_id,snapshot_json)
 SELECT id,1,'checkpoint',retry_count+1,state_version,status,id::text,snapshot_json FROM "IngestJob"
 WHERE id='40000000-0000-4000-8000-000000000002';
COMMIT;
