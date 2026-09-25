import {afterEach,expect,it,vi} from 'vitest';
import {watchDurableJob,type DurableWatchOptions} from './durable-watch';
import {createJournalFixture} from './journal.test-support';
import {JournalError} from './operation-journal';
import type {CheckpointRead,IngestCheckpoint} from './ingest-checkpoint-store';
import {parseIngestSnapshot,parseIngestRecovery,type IngestSnapshot,type IngestRecovery} from './ingest-protocol';
import type {HomeApiClient} from './api';
import type {OrderedStreamContext,OrderedStreamHandlers} from '../auth/ordered-stream';
const id='ing_11111111-1111-4111-8111-111111111111',ns='22222222-2222-4222-8222-222222222222';
const cursor=(seq:number)=>`i1:${ns}:${seq}`;
const snapshot=(seq:number,state:IngestSnapshot['state']='parsing')=>parseIngestSnapshot({ingest_id:id,head_cursor:cursor(seq),attempt:1,state_version:seq-1,state,sub_stage:null,source_title:'Synthetic',result:null,partial:false,retriable:false,error_code:null,updated_at:'2026-09-19T00:00:00.000Z',actions:{retry:false,view:false}},id,cursor(seq));
const checkpoint=(seq:number,state:IngestSnapshot['state']='parsing'):IngestCheckpoint=>({revision:crypto.randomUUID(),cursor:cursor(seq),snapshot:snapshot(seq,state),observedDoneAttempt:0});
const result=(value:IngestCheckpoint|null):CheckpointRead=>({value,revision:value?.revision??null,corrupt:false});
const resync=(seq:number)=>parseIngestRecovery({mode:'resync',reason:'checkpoint_missing',ingest_id:id,cursor:cursor(seq),head_cursor:cursor(seq),head_seq:String(seq),replay_floor:'0',snapshot:snapshot(seq)},id);
const event=(seq:number,state:IngestSnapshot['state']='parsing')=>({schema_version:1,kind:'fact',ingest_id:id,cursor:cursor(seq),seq:String(seq),attempt:1,retry:0,state_version:seq-1,state,stage:state,trace_id:id.slice(4),occurred_at:'2026-09-19T00:00:00.000Z',ts:Date.parse('2026-09-19T00:00:00.000Z'),snapshot:snapshot(seq,state)});
const context=(seq:number):OrderedStreamContext=>({signal:new AbortController().signal,valid:()=>true,id:cursor(seq)});
const stops:Array<()=>void>=[];afterEach(()=>{for(const stop of stops.splice(0))stop();vi.useRealTimers();});
function fixture(initial:IngestCheckpoint|null=null){
 let saved=result(initial),alive=true;const subscriptions:OrderedStreamHandlers[]=[],closed=vi.fn();const journal=createJournalFixture();
 journal.readCheckpoint=vi.fn(async()=>saved);journal.commitResync=vi.fn(async(_scope,_id,response:any)=>{saved=result({...checkpoint(Number(response.head_seq)),snapshot:response.snapshot});return saved;});journal.commitEvent=vi.fn(async(_scope,_id,input:any)=>{saved=result({...checkpoint(Number(input.seq)),snapshot:input.snapshot});return saved;});
 const api:HomeApiClient={getCities:vi.fn(),getInspirations:vi.fn(),getCandidates:vi.fn(),parseInput:vi.fn(),startIngest:vi.fn(),getIngestRecovery:vi.fn(async(_id,input)=>input.mode==='resync'?resync(3):({mode:'replay' as const,ingest_id:id,cursor:input.cursor!,head_cursor:cursor(3),head_seq:'3',replay_floor:'0'})),watchDurableIngest:vi.fn((_id,handlers)=>{subscriptions.push(handlers);return closed;})};
 const onCheckpoint=vi.fn(),onComplete=vi.fn(),onError=vi.fn();
 const start=(extra:Partial<DurableWatchOptions>={})=>{const stop=watchDurableJob({...extra,jobId:id,scope:{ownerId:'owner-a',valid:()=>alive},journal,api,onCheckpoint,onComplete,onError});stops.push(stop);return stop;};
 return {journal,api,subscriptions,closed,onCheckpoint,onComplete,onError,start,get saved(){return saved;},setSaved:(next:CheckpointRead)=>{saved=next;},invalidate:()=>{alive=false;}};
}
it('bootstrap waits for snapshot/cursor persistence before opening SSE and never creates a job',async()=>{
 const f=fixture();let resolve!:(value:CheckpointRead)=>void;f.journal.commitResync=vi.fn(()=>new Promise<CheckpointRead>(r=>{resolve=r;}));f.start();await vi.waitFor(()=>expect(f.journal.commitResync).toHaveBeenCalled());expect(f.api.watchDurableIngest).not.toHaveBeenCalled();expect(f.onCheckpoint).not.toHaveBeenCalled();
 const saved=result(checkpoint(3));resolve(saved);await vi.waitFor(()=>expect(f.api.watchDurableIngest).toHaveBeenCalledTimes(1));expect(f.subscriptions[0].cursor()).toBe(cursor(3));expect(f.api.startIngest).not.toHaveBeenCalled();
});
it('replay head is only a hint and individual events advance the cursor after persistence',async()=>{
 const f=fixture(checkpoint(1,'created'));f.start();await vi.waitFor(()=>expect(f.subscriptions).toHaveLength(1));expect(f.subscriptions[0].cursor()).toBe(cursor(1));
 let resolve!:(value:CheckpointRead)=>void;f.journal.commitEvent=vi.fn(()=>new Promise<CheckpointRead>(r=>{resolve=r;}));const work=f.subscriptions[0].onEvent(event(2),context(2));await vi.waitFor(()=>expect(f.journal.commitEvent).toHaveBeenCalled());expect(f.subscriptions[0].cursor()).toBe(cursor(1));
 resolve(result(checkpoint(2)));await work;expect(f.subscriptions[0].cursor()).toBe(cursor(2));
});
it('a changed storage revision causes fresh recovery instead of applying a late resync',async()=>{
 const f=fixture();f.journal.commitResync=vi.fn(async()=>{const winner=result(checkpoint(4));f.setSaved(winner);return winner;});f.api.getIngestRecovery=vi.fn(async(_id,input)=>input.mode==='resync'?resync(3):({mode:'replay' as const,ingest_id:id,cursor:input.cursor!,head_cursor:cursor(4),head_seq:'4',replay_floor:'0'}));f.start();await vi.waitFor(()=>expect(f.subscriptions).toHaveLength(1));expect(f.subscriptions[0].cursor()).toBe(cursor(4));expect(f.onCheckpoint).toHaveBeenCalledTimes(1);expect(f.onCheckpoint.mock.calls[0][0].cursor).toBe(cursor(4));
});
it('late callbacks from a replaced connection cannot write or fail the new connection',async()=>{
 const f=fixture(checkpoint(1,'created'));f.start();await vi.waitFor(()=>expect(f.subscriptions).toHaveLength(1));const old=f.subscriptions[0];
 f.setSaved(result(checkpoint(2)));await old.onControl({kind:'complete',ingest_id:id,cursor:cursor(1),attempt:1,state_version:0},context(1));await vi.waitFor(()=>expect(f.subscriptions).toHaveLength(2));
 await expect(old.onEvent(event(3),context(3))).rejects.toMatchObject({code:'JOURNAL_CONTEXT_CHANGED'});old.onError('transport');expect(f.onError).not.toHaveBeenCalled();expect(f.journal.commitEvent).not.toHaveBeenCalled();
 f.setSaved(result(checkpoint(3,'failed')));await f.subscriptions[1].onControl({kind:'complete',ingest_id:id,cursor:cursor(3),attempt:1,state_version:2},context(3));expect(f.onComplete).toHaveBeenCalledTimes(1);
});
it('storage failure or cancellation cannot open a stream from an uncommitted head',async()=>{
 const f=fixture();f.journal.commitResync=vi.fn(async()=>{throw new JournalError('JOURNAL_UNAVAILABLE');});f.start();await vi.waitFor(()=>expect(f.onError).toHaveBeenCalled());expect(f.subscriptions).toHaveLength(0);
 const other=fixture();let resolve!:(value:CheckpointRead)=>void;other.journal.commitResync=vi.fn(()=>new Promise<CheckpointRead>(r=>{resolve=r;}));const stop=other.start();await vi.waitFor(()=>expect(other.journal.commitResync).toHaveBeenCalled());const scope=vi.mocked(other.journal.commitResync).mock.calls[0][0];stop();expect(scope.signal?.aborted).toBe(true);resolve(result(checkpoint(3)));await Promise.resolve();expect(other.subscriptions).toHaveLength(0);expect(other.onCheckpoint).not.toHaveBeenCalled();
});
it('initial recovery has a cancellation deadline',async()=>{
 vi.useFakeTimers();const f=fixture();f.api.getIngestRecovery=vi.fn((_id,_input,signal)=>new Promise<IngestRecovery>((_resolve,reject)=>{signal?.addEventListener('abort',()=>reject(new Error('aborted')));}));f.start();await vi.advanceTimersByTimeAsync(10001);expect(f.onError).toHaveBeenCalledTimes(1);expect(f.subscriptions).toHaveLength(0);
});

it('pending replay gets a commit opportunity before rotation and bounds a stalled first frame',async()=>{
 vi.useFakeTimers();const f=fixture(checkpoint(1,'created'));f.start({shouldYield:()=>true});await vi.advanceTimersByTimeAsync(2500);
 expect(f.subscriptions).toHaveLength(1);expect(f.subscriptions[0].shouldYield?.()).toBe(false);
 await f.subscriptions[0].onEvent(event(2),context(2));expect(f.subscriptions[0].shouldYield?.()).toBe(true);await vi.advanceTimersByTimeAsync(15000);expect(f.onError).not.toHaveBeenCalled();
 const stuck=fixture(checkpoint(1,'created'));stuck.start({shouldYield:()=>true});await vi.advanceTimersByTimeAsync(15001);expect(stuck.onError).toHaveBeenCalledTimes(1);expect(stuck.closed).toHaveBeenCalled();
});

it('a saved terminal head waits for delayed complete before yielding',async()=>{
 vi.useFakeTimers();const f=fixture(checkpoint(3,'failed'));f.start({shouldYield:()=>true});await vi.advanceTimersByTimeAsync(2500);
 expect(f.subscriptions[0].shouldYield?.()).toBe(false);await f.subscriptions[0].onControl({kind:'complete',ingest_id:id,cursor:cursor(3),attempt:1,state_version:2},context(3));expect(f.onComplete).toHaveBeenCalledTimes(1);
 await vi.advanceTimersByTimeAsync(15000);expect(f.onError).not.toHaveBeenCalled();
});
