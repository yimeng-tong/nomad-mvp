import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseIngestCheckpoint} from './execution-checkpoint.js';
const ready={version:1,adapterRevision:'fixture-v1',attempt:1,phase:'ready',inFlight:null,inFlightReplayable:null,partial:false};
test('checkpoint rejects incompatible attempts, versions, incomplete phases and unknown private fields',()=>{
 assert.deepEqual(parseIngestCheckpoint(ready,1),ready);
 for(const value of [{...ready,version:2},{...ready,adapterRevision:'unknown'},{...ready,attempt:2},{...ready,phase:'saved'},{...ready,inFlight:'geo'},{...ready,secret:'forbidden'}])assert.throws(()=>parseIngestCheckpoint(value,1),/INGEST_CHECKPOINT_INVALID/);
});
test('checkpoint keeps bounded provider facts separate from event DTO and rejects oversized input',()=>{
 const fetched={...ready,phase:'fetched',post:{title:'Synthetic',text:'Private source text',media:[{url:'https://synthetic.invalid/image',kind:'image'}]}};
 assert.equal(parseIngestCheckpoint(fetched,1).post?.text,'Private source text');
 assert.throws(()=>parseIngestCheckpoint({...fetched,post:{...fetched.post,text:'x'.repeat(1024*1024+1)}},1),/INGEST_CHECKPOINT_INVALID/);
 assert.throws(()=>parseIngestCheckpoint({...fetched,post:{...fetched.post,media:[{url:'https://synthetic.invalid',kind:'image',width:-1}]}},1),/INGEST_CHECKPOINT_INVALID/);
});
