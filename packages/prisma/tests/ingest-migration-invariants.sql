DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "IngestJob" WHERE id='40000000-0000-4000-8000-000000000001' AND "userId"='10000000-0000-4000-8000-000000000001' AND source_hash=repeat('c',64) AND auth_version IS NULL AND state_version=0 AND snapshot_json IS NULL) THEN RAISE EXCEPTION 'Legacy job changed or trusted'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "IngestJob" WHERE id='40000000-0000-4000-8000-000000000002' AND retry_count=1 AND state_version=3 AND snapshot_json->>'attempt'='2' AND snapshot_json->>'partial'='true') THEN RAISE EXCEPTION 'Snapshot or attempt lost'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "IngestCommand" c JOIN "IngestJob" j ON j.id=c.job_id AND j."userId"=c.user_id WHERE c.operation_id='50000000-0000-4000-8000-000000000001' AND c.attempt=2 AND c.disposition='retried') THEN RAISE EXCEPTION 'Command owner/result reference lost'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "Asset" a JOIN "Inspiration" i ON i.id=a."inspirationId" WHERE i.id='60000000-0000-4000-8000-000000000001' AND i.text='Retained fixture content' AND a.cos_key='synthetic/retained-object') THEN RAISE EXCEPTION 'Partial content lost'; END IF;
END $$;
SELECT 'ingest-migration-invariants-passed' AS result;
