INSERT INTO "IngestJob" (id,"userId",source_type,source_hash,source_url,status,retry_count,auth_version,state_version,snapshot_json)
VALUES ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','xhs',repeat('d',64),'https://xhslink.com/synthetic-partial','failed',1,0,3,
'{"ingest_id":"ing_40000000-0000-4000-8000-000000000002","attempt":2,"state_version":3,"state":"failed","source_title":"Synthetic partial","stored_count":1,"partial":true,"retriable":true,"error_code":"INGEST_FETCH_FAILED","updated_at":"2026-09-19T00:00:00Z","actions":{"retry":true,"view":true},"result":{"inspiration_id":"60000000-0000-4000-8000-000000000001","locate_status":"pending","asset_count":1,"city_name":null}}');
INSERT INTO "Inspiration" (id,"userId","jobId",title,text,tags,source_hash)
VALUES ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','Synthetic partial','Retained fixture content',ARRAY[]::text[],repeat('e',64));
INSERT INTO "Asset" (id,"inspirationId",kind,cos_key)
VALUES ('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','image','synthetic/retained-object');
INSERT INTO "IngestCommand" (user_id,operation_id,kind,request_hash,job_id,attempt,disposition)
VALUES ('10000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','retry',repeat('f',64),'40000000-0000-4000-8000-000000000002',2,'retried');
