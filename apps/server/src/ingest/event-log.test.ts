import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDurableIngestEvent } from './event-log.js';
import { initialSnapshot, advanceSnapshot } from './job-state.js';
const jobId='11111111-1111-4111-8111-111111111111',streamId='22222222-2222-4222-8222-222222222222';
const base=initialSnapshot(`ing_${jobId}`);
test('immutable event DTO preserves exact seq, diagnostics and only allowed snapshot facts',()=>{
 const snapshot={...advanceSnapshot(base,{state:'parsing',sub_stage:'asr',fetched_count:0,source_title:'来源 https://private.invalid/token'},1),sourceUrl:'private',provider_secret:'private'};
 const event=buildDurableIngestEvent({jobId,streamId,seq:9007199254740993n,kind:'fact',traceId:'https://private.invalid',snapshot,occurredAt:new Date('2026-09-19T00:00:00Z')});
 assert.equal(event.seq,'9007199254740993');assert.equal(event.sub_stage,'asr');assert.equal(event.snapshot.fetched_count,0);
 assert.equal(event.stage,event.snapshot.state);assert.equal(event.trace_id,jobId);assert.equal(event.cursor,event.snapshot.head_cursor);
 assert.ok(!JSON.stringify(event).includes('private')); assert.equal(event.snapshot.source_title,'来源 [链接]');
 snapshot.source_title='later';assert.equal(event.snapshot.source_title,'来源 [链接]');
});
test('corrupt or foreign snapshot identities and unsafe diagnostics cannot become a new event',()=>{
 for(const snapshot of [{...base,ingest_id:'ing_other'},{...base,attempt:0},{...base,sub_stage:'text'},{...base,fetched_count:-1},{...base,actions:{retry:true,view:false}}]){
  assert.throws(()=>buildDurableIngestEvent({jobId,streamId,seq:1n,kind:'fact',traceId:jobId,snapshot:snapshot as any,occurredAt:new Date()}),/INGEST_EVENT_STATE_UNAVAILABLE/);
 }
});
test('a checkpoint has an explicit observation time and cannot manufacture a successful missing result',()=>{
 const event=buildDurableIngestEvent({jobId,streamId,seq:1n,kind:'checkpoint',traceId:jobId,snapshot:base,occurredAt:new Date('2026-09-20T00:00:00Z')});
 assert.equal(event.kind,'checkpoint');assert.equal(event.occurred_at,'2026-09-20T00:00:00.000Z');assert.equal(event.snapshot.updated_at,base.updated_at);
 assert.throws(()=>buildDurableIngestEvent({jobId,streamId,seq:1n,kind:'fact',traceId:jobId,snapshot:{...base,state:'done'},occurredAt:new Date()}),/INGEST_EVENT_STATE_UNAVAILABLE/);
});
