import { expect, it } from 'vitest';
import { addBatch, acceptEntry, applySnapshot, rebaseJobSnapshot, emptyDock, elapseVisible, setDockVisibility } from './dock-model';
import type { components } from 'nomad-types/src/api-types';
type Snapshot=components['schemas']['IngestSnapshot'];
const snapshot=(id:string,version:number,state:Snapshot['state']='created'):Snapshot=>({ingest_id:id,attempt:1,state_version:version,state,source_title:'来源',partial:false,retriable:false,updated_at:'2026-09-19T00:00:00Z',result:state==='done'?{inspiration_id:id,asset_count:1,city_name:null,locate_status:'pending'}:null,stored_count:state==='done'?1:null,actions:{retry:false,view:state==='done'}});
it('completions receive ten uninterrupted visible seconds in FIFO without running updates taking over',()=>{
 let state=addBatch(emptyDock(),{id:'batch',entries:[{id:'a',url:'https://xhslink.com/a'},{id:'b',url:'https://xhslink.com/b'}],unrecognized:[],duplicates:0});
 state=acceptEntry(state,'a',{disposition:'created',snapshot:snapshot('job-a',0)});
 state=acceptEntry(state,'b',{disposition:'created',snapshot:snapshot('job-b',0)});
 state=setDockVisibility(state,true);
 state=applySnapshot(state,snapshot('job-b',1,'done'));state=elapseVisible(state,6000);
 state=applySnapshot(state,snapshot('job-a',1,'parsing'));expect(state.presenting?.jobId).toBe('job-b');
 state=applySnapshot(state,snapshot('job-a',2,'done'));expect(state.completions).toHaveLength(1);
 state=elapseVisible(state,3999);expect(state.presenting?.jobId).toBe('job-b');
 state=elapseVisible(state,1);expect(state.presenting).toMatchObject({jobId:'job-a',remainingMs:10000});
 state=elapseVisible(state,10000);expect(state.presenting).toBeNull();
});
it('hidden time is not consumed, repeated terminals do not restart windows, and stale snapshots do not regress facts',()=>{
 let state=addBatch(emptyDock(),{id:'batch',entries:[{id:'a',url:'https://xhslink.com/a'}],unrecognized:[],duplicates:0});
 state=acceptEntry(state,'a',{disposition:'created',snapshot:snapshot('job-a',0)});state=setDockVisibility(state,true);
 state=applySnapshot(state,snapshot('job-a',4,'done'));state=elapseVisible(state,2000);
 state=setDockVisibility(state,false);state=elapseVisible(state,60000);expect(state.presenting?.remainingMs).toBe(8000);
 state=applySnapshot(state,snapshot('job-a',4,'done'));state=applySnapshot(state,snapshot('job-a',3,'parsing'));
 expect(state.entries[0].snapshot?.state).toBe('done');expect(state.presenting?.remainingMs).toBe(8000);expect(state.completions).toHaveLength(0);
});
it('known reused results are visible as duplicates without a new completion window',()=>{
 let state=addBatch(emptyDock(),{id:'batch',entries:[{id:'a',url:'https://xhslink.com/a'}],unrecognized:[],duplicates:0});
 state=acceptEntry(state,'a',{disposition:'reused',snapshot:snapshot('job-a',7,'done')});
 expect(state.entries[0].disposition).toBe('reused');expect(state.presenting).toBeNull();
});


it('a late accepted retry can expose an already observed GET result without restarting its window',()=>{
 let state=addBatch(emptyDock(),{id:'batch',entries:[{id:'a',url:'https://xhslink.com/a'}],unrecognized:[],duplicates:0});
 state=acceptEntry(state,'a',{disposition:'created',snapshot:snapshot('job-a',1,'failed')},1);
 const done={...snapshot('job-a',5,'done'),attempt:2};state=applySnapshot(state,done);expect(state.presenting).toBeNull();
 state=acceptEntry(state,'a',{disposition:'retried',snapshot:{...snapshot('job-a',4,'created'),attempt:2}},1,true);
 expect(state.presenting?.snapshot).toEqual(done);state=setDockVisibility(state,true);state=elapseVisible(state,4000);
 state=acceptEntry(state,'a',{disposition:'retried',snapshot:done},1,true);expect(state.presenting?.remainingMs).toBe(6000);expect(state.completions).toHaveLength(0);
});
it('authoritative generation resync retains the current FIFO remainder and unrelated results',()=>{
 let state=addBatch(emptyDock(),{id:'batch',entries:[{id:'a',url:'a'},{id:'b',url:'b'}],unrecognized:[],duplicates:0});
 state=acceptEntry(state,'a',{disposition:'created',snapshot:snapshot('job-a',5,'done')});state=acceptEntry(state,'b',{disposition:'created',snapshot:snapshot('job-b',5,'done')});
 state=setDockVisibility(state,true);state=elapseVisible(state,4000);
 state=rebaseJobSnapshot(state,{...snapshot('job-a',1,'done'),source_title:'Updated authoritative title'},0);
 expect(state.presenting).toMatchObject({jobId:'job-a',remainingMs:6000,snapshot:{state_version:1,source_title:'Updated authoritative title'}});
 expect(state.completions).toHaveLength(1);expect(state.completions[0].jobId).toBe('job-b');
 state=rebaseJobSnapshot(state,snapshot('job-a',0,'fetching'),0);expect(state.presenting?.jobId).toBe('job-b');
 state=applySnapshot(state,snapshot('job-a',2,'done'));expect(state.completions[0].jobId).toBe('job-a');
});
