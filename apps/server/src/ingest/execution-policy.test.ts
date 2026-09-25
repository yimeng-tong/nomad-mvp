import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolveIngestExecutionPolicy} from './execution-policy.js';
test('worker defaults and explicit recovery isolation never enable claim',()=>{
 assert.equal(resolveIngestExecutionPolicy({}).enabled,false);
 assert.equal(resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled'}).enabled,false);
 assert.equal(resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled',INGEST_RECOVERY_ISOLATED:'true'}).enabled,false);
 assert.equal(resolveIngestExecutionPolicy({INGEST_WORKER_MODE:'enabled',INGEST_RECOVERY_ISOLATED:'false'}).enabled,true);
});
test('invalid operational limits do not turn into unlimited or zero-duration leases',()=>{
 for(const input of [{INGEST_WORKER_MODE:'yes'},{INGEST_RECOVERY_ISOLATED:'0'},{INGEST_LEASE_MS:'999'},{INGEST_LEASE_MS:'1e5'}, {INGEST_CONCURRENCY:'17'},{INGEST_POLL_MS:'0'},{INGEST_STEP_TIMEOUT_MS:'99'},{INGEST_STEP_TIMEOUT_MS:'300001'}])assert.throws(()=>resolveIngestExecutionPolicy(input),/INGEST_WORKER_CONFIGURATION_INVALID/);
});
