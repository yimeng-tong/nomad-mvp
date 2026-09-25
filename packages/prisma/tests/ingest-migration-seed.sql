-- Synthetic legacy job before the Story1.6 additive migration. No real source was fetched.
INSERT INTO "IngestJob" (id,"userId",source_type,source_hash,source_url,status)
 VALUES ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','xhs',repeat('c',64),'https://xhslink.com/synthetic-legacy','failed');
