import {parseIngestCursor,parseIngestEvent,parseIngestRecovery,parseIngestSnapshot,validIngestJobId,type IngestSnapshot} from './ingest-protocol';
import type {JournalScope} from './operation-journal';
export type IngestCheckpoint={revision:string;cursor:string;snapshot:IngestSnapshot;observedDoneAttempt:number};
export type CheckpointRead={value:IngestCheckpoint|null;revision:string|null;corrupt:boolean};
export interface IngestCheckpointJournal {
 readCheckpoint(scope:JournalScope,jobId:string):Promise<CheckpointRead>;
 commitEvent(scope:JournalScope,jobId:string,event:unknown):Promise<CheckpointRead>;
 commitResync(scope:JournalScope,jobId:string,recovery:unknown,expectedRevision:string|null):Promise<CheckpointRead>;
}
export type JournalTransaction=<T>(stores:string[],mode:IDBTransactionMode,scope:JournalScope|undefined,
 work:(tx:IDBTransaction,done:(value:T)=>void,run:(fn:()=>void)=>void)=>void)=>Promise<T>;
type Meta={version:1;ownerId:string;jobId:string;revision:string;expiresAt:number;observedDoneAttempt:number};
type Stored=Meta & {cursor:string;attempt:number;stateVersion:number;state:IngestSnapshot['state'];keyId:string;payload:{iv:Uint8Array<ArrayBuffer>;bytes:ArrayBuffer}};
type Tombstone=Meta & {corrupt:true};
type Entry=Stored|Tombstone;
type Dependencies={transaction:JournalTransaction;key:(scope:JournalScope,create?:boolean)=>Promise<{key:CryptoKey;id:string}>;guard:(scope:JournalScope)=>void;clock:()=>number;
 fail:(code:'JOURNAL_CORRUPT'|'JOURNAL_CONTEXT_CHANGED'|'JOURNAL_CAPACITY'|'JOURNAL_CHECKPOINT_CHANGED')=>Error};
const ttl=7*86400000,capacity=2048;
const uuid=(value:unknown):value is string=>typeof value==='string'&&value.length===36&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const integer=(value:unknown,min=0):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min;
const isTombstone=(entry:Entry):entry is Tombstone=>'corrupt' in entry&&entry.corrupt===true;
const sameBytes=(a:ArrayBuffer|Uint8Array<ArrayBuffer>,b:ArrayBuffer|Uint8Array<ArrayBuffer>)=>{const left=a instanceof ArrayBuffer?new Uint8Array(a):a,right=b instanceof ArrayBuffer?new Uint8Array(b):b;return left.length===right.length&&left.every((value,index)=>value===right[index]);};
const sameEntry=(a:Entry|null,b:Entry|null):boolean=>{
 if(!a||!b)return a===b;if(a.revision!==b.revision||a.expiresAt!==b.expiresAt||a.ownerId!==b.ownerId||a.jobId!==b.jobId)return false;
 if(isTombstone(a)||isTombstone(b))return isTombstone(a)&&isTombstone(b);
 return a.cursor===b.cursor&&a.attempt===b.attempt&&a.stateVersion===b.stateVersion&&a.state===b.state&&a.keyId===b.keyId&&sameBytes(a.payload.iv,b.payload.iv)&&sameBytes(a.payload.bytes,b.payload.bytes);
};
const rank={created:0,fetching:1,parsing:2,geo:3,storing:4,done:5,failed:5};
const aad=(row:Stored)=>new TextEncoder().encode(JSON.stringify(['nomad-ingest-checkpoint-v1',row.ownerId,row.jobId,row.revision,row.cursor,row.attempt,row.stateVersion,row.state,row.keyId,row.expiresAt]));
export function createIngestCheckpointStore(deps:Dependencies):IngestCheckpointJournal {
 const {transaction,key,guard,clock,fail}=deps;
 const checkJob=(scope:JournalScope,jobId:string)=>{guard(scope);if(!validIngestJobId(jobId))throw fail('JOURNAL_CORRUPT');};
 const validate=(raw:unknown,scope:JournalScope,jobId:string):Entry=>{
  const row=raw as Entry;
  if(!row||row.version!==1||row.ownerId!==scope.ownerId||row.jobId!==jobId||!uuid(row.revision)||!Number.isFinite(row.expiresAt)||!integer(row.observedDoneAttempt))throw fail('JOURNAL_CORRUPT');
  if('corrupt' in row&&row.corrupt===true)return row;
  const value=row as Stored;parseIngestCursor(value.cursor);
  if(!integer(value.attempt,1)||!integer(value.stateVersion)||!Object.hasOwn(rank,value.state)||!uuid(value.keyId)
   ||!value.payload||!(value.payload.iv instanceof Uint8Array)||!(value.payload.iv.buffer instanceof ArrayBuffer)||value.payload.iv.length!==12||!(value.payload.bytes instanceof ArrayBuffer)||value.payload.bytes.byteLength>16384)throw fail('JOURNAL_CORRUPT');
  return value;
 };
 const tombstone=(scope:JournalScope,jobId:string,expiresAt=clock()+ttl,observedDoneAttempt=0):Tombstone=>({version:1,ownerId:scope.ownerId,jobId,revision:crypto.randomUUID(),expiresAt:Math.min(clock()+ttl,expiresAt),observedDoneAttempt,corrupt:true});
 const decode=async(scope:JournalScope,entry:Entry|null):Promise<CheckpointRead>=>{
  guard(scope);if(!entry)return {value:null,revision:null,corrupt:false};
  if(isTombstone(entry))return {value:null,revision:entry.revision,corrupt:true};
  try{
   const secret=await key(scope,false);guard(scope);if(secret.id!==entry.keyId)throw fail('JOURNAL_CORRUPT');
   const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:entry.payload.iv,additionalData:aad(entry)},secret.key,entry.payload.bytes);guard(scope);
   const snapshot=parseIngestSnapshot(JSON.parse(new TextDecoder().decode(bytes)),entry.jobId,entry.cursor);
   if(snapshot.attempt!==entry.attempt||snapshot.state_version!==entry.stateVersion||snapshot.state!==entry.state)throw fail('JOURNAL_CORRUPT');
   if(entry.expiresAt<=clock())throw fail('JOURNAL_CHECKPOINT_CHANGED');
   return {value:{revision:entry.revision,cursor:entry.cursor,snapshot,observedDoneAttempt:entry.observedDoneAttempt},revision:entry.revision,corrupt:false};
  }catch(error){guard(scope);const code=(error as {code?:string})?.code;if(['JOURNAL_UNAVAILABLE','JOURNAL_CONTEXT_CHANGED','JOURNAL_CHECKPOINT_CHANGED'].includes(code??''))throw error;return {value:null,revision:entry.revision,corrupt:true};}
 };
 const accepted=(tx:IDBTransaction,scope:JournalScope,jobId:string,run:(fn:()=>void)=>void,next:(facts:{expiresAt:number;observed:number})=>void)=>{
  const request=tx.objectStore('operations').index('jobId').getAll(jobId);
  request.onsuccess=()=>run(()=>{
   const records=request.result.filter((row:any)=>row.ownerId===scope.ownerId&&row.phase==='accepted'&&Number.isFinite(row.expiresAt)&&row.expiresAt>clock());
   if(!records.length)throw fail('JOURNAL_CHECKPOINT_CHANGED');
   const observed=Math.max(0,...records.map((row:any)=>integer(row.observedDoneAttempt)?row.observedDoneAttempt:0));
   next({expiresAt:Math.min(clock()+ttl,Math.max(...records.map((row:any)=>row.expiresAt))),observed});
  });
 };
 const readVerified=async(scope:JournalScope,jobId:string,round=0):Promise<{entry:Entry|null;result:CheckpointRead}>=>{
  checkJob(scope,jobId);
  const entry=await transaction<Entry|null>(['checkpoints'],'readwrite',scope,(tx,done,run)=>{
   const store=tx.objectStore('checkpoints'),request=store.get([scope.ownerId,jobId]);request.onsuccess=()=>run(()=>{
    if(!request.result){done(null);return;}
    if(Number.isFinite(request.result.expiresAt)&&request.result.expiresAt<=clock()){store.delete([scope.ownerId,jobId]);done(null);return;}
    try{done(validate(request.result,scope,jobId));}catch{const reset=tombstone(scope,jobId);store.put(reset);done(reset);}
   });
  });
  const result=await decode(scope,entry);
  if(entry&&!isTombstone(entry)&&result.corrupt){
   const quarantined=await transaction<Entry|null>(['checkpoints'],'readwrite',scope,(tx,done,run)=>{
    const store=tx.objectStore('checkpoints'),request=store.get([scope.ownerId,jobId]);request.onsuccess=()=>run(()=>{
     if(!request.result){done(null);return;}
     let current:Entry;try{current=validate(request.result,scope,jobId);}catch{done(null);return;}
     if(!sameEntry(current,entry)){done(null);return;}
     const broken=tombstone(scope,jobId,current.expiresAt,current.observedDoneAttempt);store.put(broken);done(broken);
    });
   });
   if(quarantined)return {entry:quarantined,result:await decode(scope,quarantined)};
   if(round>=2)throw fail('JOURNAL_CHECKPOINT_CHANGED');
   return readVerified(scope,jobId,round+1);
  }
  return {entry,result};
 };
 const read=async(scope:JournalScope,jobId:string)=>(await readVerified(scope,jobId)).result;
 const commit=async(scope:JournalScope,jobId:string,snapshot:IngestSnapshot,mode:'event'|'resync',expectedRevision?:string|null,round=0):Promise<CheckpointRead>=>{
  checkJob(scope,jobId);const cursor=snapshot.head_cursor!;
  const baseline=await readVerified(scope,jobId);
  if(mode==='event'&&baseline.result.corrupt)throw fail('JOURNAL_CORRUPT');
  if(mode==='resync'&&baseline.result.revision!==expectedRevision){if(baseline.result.value)return baseline.result;throw fail('JOURNAL_CHECKPOINT_CHANGED');}
  const facts=await transaction<{expiresAt:number;observed:number}>(['operations'],'readonly',scope,(tx,done,run)=>accepted(tx,scope,jobId,run,done));
  const secret=await key(scope);guard(scope);
  const row:Stored={version:1,ownerId:scope.ownerId,jobId,revision:crypto.randomUUID(),cursor,attempt:snapshot.attempt,stateVersion:snapshot.state_version,state:snapshot.state,
   keyId:secret.id,expiresAt:facts.expiresAt,observedDoneAttempt:facts.observed,payload:{iv:crypto.getRandomValues(new Uint8Array(12)),bytes:new ArrayBuffer(0)}};
  const plain=new TextEncoder().encode(JSON.stringify(snapshot));if(plain.byteLength>16000)throw fail('JOURNAL_CAPACITY');
  row.payload.bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv:row.payload.iv,additionalData:aad(row)},secret.key,plain);guard(scope);
  let selected:Entry;
  try{selected=await transaction<Entry>(['checkpoints','operations','keys'],'readwrite',scope,(tx,done,run)=>{
   accepted(tx,scope,jobId,run,currentFacts=>{
    if(row.expiresAt<=clock())throw fail('JOURNAL_CHECKPOINT_CHANGED');
    const keyRequest=tx.objectStore('keys').get(scope.ownerId);keyRequest.onsuccess=()=>run(()=>{
     if(keyRequest.result?.id!==secret.id||keyRequest.result.expiresAt<=clock())throw fail('JOURNAL_CHECKPOINT_CHANGED');
     const store=tx.objectStore('checkpoints'),request=store.get([scope.ownerId,jobId]);request.onsuccess=()=>run(()=>{
      let old:Entry|null=request.result?validate(request.result,scope,jobId):null;
      if(old&&old.expiresAt<=clock()){store.delete([scope.ownerId,jobId]);old=null;}
      if(!sameEntry(old,baseline.entry))throw fail('JOURNAL_CHECKPOINT_CHANGED');
      if(mode==='resync'&&(old?.revision??null)!==expectedRevision){if(old){done(old);return;}throw fail('JOURNAL_CHECKPOINT_CHANGED');}
      if(old&&isTombstone(old)){if(mode!=='resync')throw fail('JOURNAL_CORRUPT');}
      else if(old){
       const before=parseIngestCursor(old.cursor),next=parseIngestCursor(cursor);
       if(before.streamId!==next.streamId){if(mode!=='resync')throw fail('JOURNAL_CHECKPOINT_CHANGED');}
       else{
        if(next.seq<before.seq){
         if(mode==='resync'||row.attempt>old.attempt||row.stateVersion>old.stateVersion)throw fail('JOURNAL_CORRUPT');
         done({...old,observedDoneAttempt:Math.max(old.observedDoneAttempt,currentFacts.observed)});return;
        }
        if(next.seq===before.seq){
         if(row.attempt!==old.attempt||row.stateVersion!==old.stateVersion||row.state!==old.state)throw fail('JOURNAL_CORRUPT');
         if(mode==='event'){done({...old,observedDoneAttempt:Math.max(old.observedDoneAttempt,currentFacts.observed)});return;}
         // Explicit, revision-matched resync may replace a corrupt ciphertext at the same authoritative head.
        }else{
         const distance=next.seq-before.seq;
         if(mode==='event'&&distance!==1n)throw fail('JOURNAL_CHECKPOINT_CHANGED');
         if(BigInt(row.stateVersion)-BigInt(old.stateVersion)!==distance||row.attempt<old.attempt||BigInt(row.attempt-old.attempt)>distance)throw fail('JOURNAL_CORRUPT');
         if(row.attempt===old.attempt&&(rank[old.state]===5||rank[row.state]<rank[old.state]))throw fail('JOURNAL_CORRUPT');
         if(mode==='event'&&row.attempt!==old.attempt&&(row.attempt!==old.attempt+1||old.state!=='failed'||row.state!=='created'))throw fail('JOURNAL_CORRUPT');
        }
       }
      }else if(mode==='event'&&parseIngestCursor(cursor).seq!==1n)throw fail('JOURNAL_CHECKPOINT_CHANGED');
      row.observedDoneAttempt=Math.max(row.observedDoneAttempt,currentFacts.observed,old?.observedDoneAttempt??0);
      const add=()=>{const count=store.count();count.onsuccess=()=>run(()=>{if(!old&&count.result>=capacity)throw fail('JOURNAL_CAPACITY');store.put(row);done(row);});};
      const scan=store.openCursor();scan.onsuccess=()=>run(()=>{const entry=scan.result;if(entry){if(Number.isFinite(entry.value.expiresAt)&&entry.value.expiresAt<=clock())entry.delete();entry.continue();}else add();});
     });
    });
   });
  });
  }catch(error){if((error as {code?:string})?.code==='JOURNAL_CHECKPOINT_CHANGED'&&round<2)return commit(scope,jobId,snapshot,mode,expectedRevision,round+1);throw error;}
  const result=await decode(scope,selected);if(!result.value)throw fail('JOURNAL_CORRUPT');return result;
 };
 return {
  readCheckpoint:read,
  commitEvent:async(scope,jobId,input)=>{checkJob(scope,jobId);const event=parseIngestEvent(input,jobId);return commit(scope,jobId,event.snapshot,'event');},
  commitResync:async(scope,jobId,input,expected)=>{checkJob(scope,jobId);if(expected!==null&&!uuid(expected))throw fail('JOURNAL_CORRUPT');const recovery=parseIngestRecovery(input,jobId);if(recovery.mode!=='resync')throw fail('JOURNAL_CORRUPT');return commit(scope,jobId,recovery.snapshot,'resync',expected);},
 };
}
