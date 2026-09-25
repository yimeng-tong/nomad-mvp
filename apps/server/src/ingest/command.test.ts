import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { beforeEach, test } from 'node:test';
import { acceptIngestCommand, appendIngestEvent, clearIngestStateForTests, getIngestSnapshot, getJob, listLibraryInspirationsForUser, persistIngestOutput, readIngestCommand, retryIngestCommand } from './store.js';
import { assertIngestCapability, runIngestPipeline } from './pipeline.js';
import { AuthFault } from '../auth/errors.js';
const fault=(code:string)=>(error:unknown)=>error instanceof AuthFault&&error.code===code;
const input=()=>({userId:'synthetic-a',sourceUrl:`https://xhslink.com/${randomUUID()}`,traceId:randomUUID(),operationId:randomUUID()});
beforeEach(()=>{process.env.AUTH_RUNTIME_MODE='test';process.env.AUTH_PROVIDER='fixture';process.env.AUTH_TEST_ADAPTER_ENABLED='true';delete process.env.DATABASE_URL;delete process.env.INGEST_STUB_FAIL_STAGE;clearIngestStateForTests();});
test('same command and duplicate URL have one dispatcher, while an operation conflict is rejected',async()=>{
 const request=input();const results=await Promise.all([acceptIngestCommand(request),acceptIngestCommand(request),acceptIngestCommand({...request,operationId:randomUUID()})]);
 assert.equal(results.filter(x=>x.shouldRun).length,1);assert.equal(new Set(results.map(x=>x.job.id)).size,1);
 await assert.rejects(acceptIngestCommand({...request,sourceUrl:'https://xhslink.com/changed'}),fault('INGEST_COMMAND_CONFLICT'));
 const receipt=await readIngestCommand(request.userId,request.operationId);assert.equal(receipt.ingest_id,results[0].job.id);
 await assert.rejects(getIngestSnapshot('synthetic-b',results[0].job.id),fault('INGEST_JOB_NOT_FOUND'));
 await assert.rejects(readIngestCommand('synthetic-b',request.operationId),fault('INGEST_COMMAND_NOT_FOUND'));
});
test('retry has one CAS winner, retains the job identity and fences a late prior attempt',async()=>{
 const request=input(),accepted=await acceptIngestCommand(request);
 await appendIngestEvent(accepted.job.id,{state:'failed',retriable:true,error_code:'INGEST_FETCH_FAILED'},1);
 const before=await getIngestSnapshot(request.userId,accepted.job.id);
 const retry={userId:request.userId,jobId:accepted.job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:before.state_version};
 const results=await Promise.allSettled([retryIngestCommand(retry),retryIngestCommand({...retry,operationId:randomUUID()})]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 assert.equal((await retryIngestCommand(retry)).shouldRun,false);
 await assert.rejects(appendIngestEvent(accepted.job.id,{state:'parsing'},1),fault('INGEST_ATTEMPT_CHANGED'));
 const after=await getIngestSnapshot(request.userId,accepted.job.id);assert.equal(after.attempt,2);assert.equal(after.state,'created');
});
test('a failed fetch cannot invent saved media or transition from failed to done',async()=>{
 const request=input(),{job}=await acceptIngestCommand(request);process.env.INGEST_STUB_FAIL_STAGE='fetch';await runIngestPipeline(job.id);
 const snapshot=await getIngestSnapshot(request.userId,job.id);assert.equal(snapshot.state,'failed');assert.equal(snapshot.result,null);
 assert.equal((await listLibraryInspirationsForUser(request.userId)).length,0);assert.ok(!getJob(job.id)!.events.some(event=>event.state==='done'));
});
test('saved partial data survives a retried fetch failure without deleting prior assets',async()=>{
 const request=input(),{job}=await acceptIngestCommand(request);await appendIngestEvent(job.id,{state:'storing'},1);
 await persistIngestOutput({job,post:{title:'真实合成样本',text:'已保存文本',media:[]},assets:[{kind:'image',cosKey:'synthetic/object'}],candidates:[],timeEvidence:[],partial:true});
 await appendIngestEvent(job.id,{state:'failed',retriable:true,error_code:'INGEST_FINALIZE_FAILED'},1);
 const prior=await getIngestSnapshot(request.userId,job.id);
 const retry=await retryIngestCommand({userId:request.userId,jobId:job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:prior.state_version});
 process.env.INGEST_STUB_FAIL_STAGE='fetch';await runIngestPipeline(retry.job.id);
 const after=await getIngestSnapshot(request.userId,job.id);assert.equal(after.state,'failed');assert.equal(after.partial,true);assert.equal(after.result?.asset_count,1);
 assert.equal((await listLibraryInspirationsForUser(request.userId))[0].summary,'已保存文本');
});
test('current production adapters cannot present fixture extraction/rehosting as available',()=>{
 process.env.AUTH_RUNTIME_MODE='staging';process.env.AUTH_PROVIDER='aliyun-pnvs';
 assert.throws(()=>assertIngestCapability(),fault('INGEST_CAPABILITY_UNAVAILABLE'));
});

test('temporary extraction/rehosting failures retain actual content and expose an original-job retry',async()=>{
 const request=input(),{job}=await acceptIngestCommand(request);process.env.INGEST_STUB_FAIL_STAGE='rehost';
 await runIngestPipeline(job.id);const partial=await getIngestSnapshot(request.userId,job.id);
 assert.equal(partial.state,'failed');assert.equal(partial.partial,true);assert.equal(partial.actions.view,true);assert.equal(partial.actions.retry,true);
 delete process.env.INGEST_STUB_FAIL_STAGE;
 const accepted=await retryIngestCommand({userId:request.userId,jobId:job.id,operationId:randomUUID(),expectedAttempt:1,expectedVersion:partial.state_version});
 await runIngestPipeline(accepted.job.id);const done=await getIngestSnapshot(request.userId,job.id);
 assert.equal(done.state,'done');assert.equal(done.partial,false);assert.equal(done.result?.asset_count,1);
});


test('an unavailable extractor leaves unknown extracted counts nullable instead of inventing zero',async()=>{
 const request=input(),{job}=await acceptIngestCommand(request);process.env.INGEST_STUB_FAIL_STAGE='extract';await runIngestPipeline(job.id);
 const snapshot=await getIngestSnapshot(request.userId,job.id);
 assert.equal(snapshot.parsed_count,null);assert.equal(snapshot.state,'failed');assert.equal(snapshot.partial,true);
 assert.equal(snapshot.stored_count,1,'persisted record count is independently known');
});
