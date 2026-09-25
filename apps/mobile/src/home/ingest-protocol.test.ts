import {describe,it,expect} from 'vitest';
import {parseIngestCursor,parseIngestEvent,parseIngestRecovery,parseIngestSnapshot} from './ingest-protocol';
export const jobId='ing_11111111-1111-4111-8111-111111111111',stream='22222222-2222-4222-8222-222222222222';
const cursor=(seq:string)=>`i1:${stream}:${seq}`;
const snapshot={ingest_id:jobId,head_cursor:cursor('1'),attempt:1,state_version:0,state:'created',sub_stage:null,source_title:null,result:null,partial:false,retriable:false,error_code:null,updated_at:'2026-09-19T00:00:00.000Z',actions:{retry:false,view:false}};
const event={schema_version:1,kind:'fact',ingest_id:jobId,cursor:cursor('1'),seq:'1',attempt:1,retry:0,state_version:0,state:'created',stage:'created',trace_id:jobId.slice(4),occurred_at:snapshot.updated_at,ts:Date.parse(snapshot.updated_at),snapshot};
describe('durable ingest protocol',()=>{
 it('keeps exact bigint positions and rejects malformed cursors',()=>{
  expect(parseIngestCursor(cursor('9007199254740993')).seq).toBe(9007199254740993n);
  for(const value of [null,'0',cursor('01'),cursor('-1'),cursor('9223372036854775808'),cursor('1')+'\n',cursor('1e3')])expect(()=>parseIngestCursor(value)).toThrow();
 });
 it('copies only permitted snapshot facts and checks event coherence',()=>{
  const parsed=parseIngestEvent({...event,secret:'discard',snapshot:{...snapshot,source_url:'private'}},jobId);
  expect(JSON.stringify(parsed)).not.toMatch(/secret|source_url|private/);
  for(const change of [{seq:'2'},{attempt:2},{retry:1},{stage:'done'},{ts:0},{snapshot:{...snapshot,stored_count:-1}},{snapshot:{...snapshot,actions:{retry:true,view:false}}}])expect(()=>parseIngestEvent({...event,...change},jobId)).toThrow();
 });
 it('does not manufacture a successful result or a new diagnostic phase',()=>{
  expect(()=>parseIngestSnapshot({...snapshot,state:'done'},jobId,cursor('1'))).toThrow();
  expect(parseIngestSnapshot({...snapshot,state:'parsing',sub_stage:'ocr'},jobId,cursor('1')).sub_stage).toBeNull();
  expect(()=>parseIngestSnapshot({...snapshot,state:'fetching',sub_stage:'asr'},jobId,cursor('1'))).toThrow();
 });
 it('requires coherent resync facts and cannot confuse the head with replay confirmation',()=>{
  const replay={mode:'replay',ingest_id:jobId,cursor:cursor('1'),head_cursor:cursor('9'),head_seq:'9',replay_floor:'0'};
  expect(parseIngestRecovery(replay,jobId).cursor).toBe(cursor('1'));
  expect(()=>parseIngestRecovery({...replay,mode:'resync',reason:'retention',snapshot},jobId)).toThrow();
  expect(()=>parseIngestRecovery({...replay,replay_floor:'2'},jobId)).toThrow();
  expect(parseIngestRecovery({...replay,mode:'resync',reason:'checkpoint_missing',cursor:cursor('9'),snapshot:{...snapshot,head_cursor:cursor('9')}},jobId).mode).toBe('resync');
 });
});
