DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "IngestJob" WHERE id='40000000-0000-4000-8000-000000000001'
  AND event_stream_id IS NULL AND last_event_seq=0 AND replay_floor_seq=0 AND NOT execution_pending
  AND lease_owner IS NULL AND lease_expires_at IS NULL AND lease_fence=0 AND checkpoint_json IS NULL)
 THEN RAISE EXCEPTION 'Legacy ownership/execution defaults changed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "IngestEventRecord" e JOIN "IngestJob" j ON j.id=e.job_id
  WHERE e.seq=j.last_event_seq AND e.kind='checkpoint' AND e.attempt=j.retry_count+1
   AND e.state_version=j.state_version AND e.snapshot_json=j.snapshot_json
   AND j.event_stream_id='80000000-0000-4000-8000-000000000001' AND NOT j.execution_pending)
 THEN RAISE EXCEPTION 'Event snapshot or stream reference lost'; END IF;
 BEGIN
  UPDATE "IngestEventRecord" SET kind='fact';
  RAISE EXCEPTION 'Mutation unexpectedly permitted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'INGEST_EVENT_IMMUTABLE' THEN RAISE; END IF;
 END;
 BEGIN
  INSERT INTO "IngestEventRecord" SELECT * FROM "IngestEventRecord";
  RAISE EXCEPTION 'Duplicate sequence unexpectedly permitted';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 BEGIN
  INSERT INTO "IngestEventRecord"(job_id,seq,kind,attempt,state_version,stage,sub_stage,trace_id,snapshot_json)
  SELECT job_id,2,'fact',attempt,state_version,'parsing','text',trace_id,snapshot_json FROM "IngestEventRecord";
  RAISE EXCEPTION 'Legacy diagnostic write unexpectedly permitted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF (SELECT count(*) FROM "IngestEventRecord")<>1 THEN RAISE EXCEPTION 'Failed writes changed event history'; END IF;
END $$;
SELECT 'ingest-event-migration-invariants-passed' AS result;
