import { getPrisma } from '../db/prisma.js';
import { AuthFault } from '../auth/errors.js';
import { fetchXhsPost,extractPoiCandidates,standardizeCandidates,rehostMedia } from './adapters.js';
import { isSuppressedChain,selectBranchCandidates } from './branch-rules.js';
import { extractTimeEvidence } from './evidence.js';
import { assertIngestCapability } from './pipeline.js';
import { isXhsUrl } from './link-parser.js';
import { getOrHydrateJob,appendIngestEvent,persistIngestOutput } from './store.js';
import { lockIngestLease,type IngestLease } from './execution-lease.js';
import { checkpointFromRow,commitIngestCheckpoint,type IngestExecutionCheckpoint } from './execution-checkpoint.js';
import type { IngestPatch } from './job-state.js';

/** Abort stops awaiting a provider; a late result is consumed but never published. */
export function abortableIngestStep<T>(signal:AbortSignal,work:()=>Promise<T>):Promise<T>{
 signal.throwIfAborted();
 return new Promise((resolve,reject)=>{
  const aborted=()=>reject(signal.reason);signal.addEventListener('abort',aborted,{once:true});
  Promise.resolve().then(()=>{signal.throwIfAborted();return work();}).then(resolve,reject).finally(()=>signal.removeEventListener('abort',aborted));
 });
}
export async function runDurableIngestPipeline(lease:IngestLease,signal:AbortSignal,options:{onCheckpoint?:(checkpoint:IngestExecutionCheckpoint)=>Promise<void>;assertCapability?:()=>void;stepTimeoutMs?:number}={}){
 const stepTimeoutMs=options.stepTimeoutMs??30000;
 if(!Number.isSafeInteger(stepTimeoutMs)||stepTimeoutMs<100||stepTimeoutMs>300000)throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
 const db=getPrisma();if(!db)throw new AuthFault('INGEST_EXECUTION_UNAVAILABLE',503);
 const job=await getOrHydrateJob(`ing_${lease.jobId}`);if(!job)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
 const emit=(patch:IngestPatch & {state:NonNullable<IngestPatch['state']>})=>{signal.throwIfAborted();return appendIngestEvent(job.id,patch,lease.attempt,lease);};
 let checkpoint:IngestExecutionCheckpoint;
 const step=async<T>(work:(stepSignal:AbortSignal)=>Promise<T>):Promise<T>=>{
  const timeout=new AbortController(),combined=AbortSignal.any([signal,timeout.signal]);
  const timer=setTimeout(()=>timeout.abort(new AuthFault(checkpoint.inFlightReplayable===false?'INGEST_STEP_OUTCOME_UNKNOWN':'INGEST_STEP_TIMEOUT',503,true)),stepTimeoutMs);timer.unref();
  try{return await abortableIngestStep(combined,()=>work(combined));}finally{clearTimeout(timer);}
 };
 const observed=async()=>{signal.throwIfAborted();if(options.onCheckpoint)await abortableIngestStep(signal,()=>options.onCheckpoint!(structuredClone(checkpoint)));};
 const save=async(next:IngestExecutionCheckpoint,patch:IngestPatch={})=>{
  signal.throwIfAborted();checkpoint=(await commitIngestCheckpoint(db,lease,next,patch)).checkpoint;await observed();
 };
 try{
  signal.throwIfAborted();(options.assertCapability??assertIngestCapability)();
  const row=await db.$transaction(tx=>lockIngestLease(tx,lease));
  if(row.executionFailureCount>=5)throw new AuthFault('INGEST_RECOVERY_EXHAUSTED',503,true);
  checkpoint=checkpointFromRow(row);
  if(!isXhsUrl(job.sourceUrl))throw new AuthFault('INGEST_XHS_URL_REQUIRED',400,false);
  // The persisted effect classification survives configuration changes across a restart.
  if(checkpoint.inFlight!==null&&checkpoint.inFlightReplayable===false)throw new AuthFault('INGEST_RECOVERY_UNCERTAIN',503,true);
  if(checkpoint.phase==='ready'){
   if(checkpoint.inFlight==='fetch'&&process.env.XHS_DOWNLOADER_URL)throw new AuthFault('INGEST_CHECKPOINT_ADAPTER_CHANGED',503,true);
   if(checkpoint.inFlight===null)await save({...checkpoint,inFlight:'fetch',inFlightReplayable:!process.env.XHS_DOWNLOADER_URL},{state:'fetching'});
   let post;
   try{post=await step(stepSignal=>fetchXhsPost(job.sourceUrl,{signal:stepSignal}));}catch(error){signal.throwIfAborted();if(error instanceof AuthFault)throw error;throw new AuthFault('INGEST_FETCH_FAILED',503,true);}
   if(!post.text.trim()&&!post.media.length)throw new AuthFault('INGEST_CONTENT_UNAVAILABLE',422,false);
   await save({...checkpoint,phase:'fetched',inFlight:null,inFlightReplayable:null,post},{state:'parsing',sub_stage:'multimodal',source_title:post.title,fetched_count:post.media.length});
  }
  if(checkpoint.phase==='fetched'){
   if(checkpoint.inFlight===null)await save({...checkpoint,inFlight:'extract',inFlightReplayable:true});
   let extracted:NonNullable<IngestExecutionCheckpoint['extracted']>=[],partial=checkpoint.partial,diagnostic=checkpoint.diagnostic,known=true;
   try{extracted=await step(()=>extractPoiCandidates(checkpoint.post!));}catch(error){signal.throwIfAborted();if(error instanceof AuthFault)throw error;partial=true;known=false;diagnostic='INGEST_EXTRACTION_DEGRADED';}
   await save({...checkpoint,phase:'extracted',inFlight:null,inFlightReplayable:null,extracted,partial,diagnostic},extracted.length?{state:'geo',parsed_count:extracted.length}:known?{parsed_count:0}:{});
  }
  if(checkpoint.phase==='extracted'){
   if(checkpoint.inFlight===null)await save({...checkpoint,inFlight:'geo',inFlightReplayable:true});
   let standardized:NonNullable<IngestExecutionCheckpoint['standardized']>={candidates:[]},partial=checkpoint.partial,diagnostic=checkpoint.diagnostic;
   try{if(checkpoint.extracted!.length)standardized=await step(()=>standardizeCandidates(checkpoint.extracted!));}catch(error){signal.throwIfAborted();if(error instanceof AuthFault)throw error;partial=true;diagnostic='INGEST_GEO_DEGRADED';}
   await save({...checkpoint,phase:'standardized',inFlight:null,inFlightReplayable:null,standardized,partial,diagnostic},{state:'storing'});
  }
  if(checkpoint.phase==='standardized'){
   if(checkpoint.inFlight===null)await save({...checkpoint,inFlight:'rehost',inFlightReplayable:true});
   let assets:NonNullable<IngestExecutionCheckpoint['assets']>=[],partial=checkpoint.partial,diagnostic=checkpoint.diagnostic;
   try{assets=await step(()=>rehostMedia(checkpoint.post!.media,job.sourceUrl));}catch(error){signal.throwIfAborted();if(error instanceof AuthFault)throw error;partial=true;diagnostic='INGEST_REHOST_DEGRADED';}
   if(!checkpoint.post!.text.trim()&&!assets.length)throw new AuthFault('INGEST_NOT_SAVED',503,true);
   await save({...checkpoint,phase:'rehosted',inFlight:null,inFlightReplayable:null,assets,partial,diagnostic});
  }
  if(checkpoint.phase==='rehosted'){
   signal.throwIfAborted();
   const point=checkpoint.standardized!.highConfidence;
   const highConfidence=!checkpoint.partial&&point&&!isSuppressedChain(point)?point:undefined;
   const main=typeof highConfidence?.lat==='number'&&typeof highConfidence.lon==='number'?{lat:highConfidence.lat,lon:highConfidence.lon}:undefined;
   const candidates=selectBranchCandidates(checkpoint.standardized!.candidates,main);
   const saved={...checkpoint,phase:'saved' as const};
   await persistIngestOutput({job,post:checkpoint.post!,assets:checkpoint.assets!,highConfidence,candidates,timeEvidence:extractTimeEvidence(checkpoint.post!,job.sourceUrl),partial:checkpoint.partial,lease,checkpoint:saved});
   checkpoint=saved;await observed();
  }
  const latest=await getOrHydrateJob(job.id);
  if(checkpoint.phase!=='saved'||!latest?.snapshot?.result)throw new AuthFault('INGEST_CHECKPOINT_INVALID',503,false);
  await emit({state:checkpoint.partial?'failed':'done',partial:checkpoint.partial,retriable:checkpoint.partial,error_code:checkpoint.diagnostic,
   candidate_count:latest.snapshot.candidate_count??undefined,stored_count:1});
 }catch(error){
  if(signal.aborted)return;
  if(error instanceof AuthFault&&['INGEST_LEASE_LOST','INGEST_ATTEMPT_CHANGED','INGEST_STATE_CHANGED','INGEST_CHECKPOINT_CHANGED','AUTH_ACCOUNT_UNAVAILABLE','AUTH_CONTEXT_CHANGED'].includes(error.code))throw error;
  await emit({state:'failed',error_code:error instanceof AuthFault&&error.code.startsWith('INGEST_')?error.code:'INGEST_PIPELINE_FAILED',retriable:error instanceof AuthFault?error.retriable:true});
 }
}
