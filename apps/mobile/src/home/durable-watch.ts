import {AuthApiError} from '../auth/api';
import type {OrderedStreamContext,OrderedStreamFailure} from '../auth/ordered-stream';
import type {HomeApiClient} from './api';
import {JournalError,type JournalScope,type OperationJournal} from './operation-journal';
import type {IngestCheckpoint} from './ingest-checkpoint-store';
import {parseIngestControl,parseIngestEvent,parseIngestRecovery,IngestProtocolError} from './ingest-protocol';
export type DurableWatchOptions={jobId:string;scope:JournalScope;journal:OperationJournal;api:HomeApiClient;
 shouldYield?:()=>boolean;onYield?:()=>void;
 onCheckpoint:(checkpoint:IngestCheckpoint,resync:boolean)=>void;onComplete:(checkpoint:IngestCheckpoint)=>void;
 onError:(reason:OrderedStreamFailure|'recovery',error?:unknown)=>void};
/** One job, one logical subscription. Recovery reads never acknowledge a head without saving its facts. */
export function watchDurableJob(options:DurableWatchOptions):()=>void {
 const {api,journal,jobId}=options;if(!api.getIngestRecovery||!api.watchDurableIngest)throw new Error('INGEST_RECOVERY_UNAVAILABLE');
 const abort=new AbortController();let stopped=false,transportStop:(()=>void)|undefined,preparing=false,preparationDeadline:ReturnType<typeof setTimeout>|undefined,current:IngestCheckpoint|null=null,reconnects=0,generation=0,knownHead:string|undefined,progressDeadline:ReturnType<typeof setTimeout>|undefined;
 const valid=()=>!stopped&&!abort.signal.aborted&&!options.scope.signal?.aborted&&options.scope.valid();
 const scope=(context?:OrderedStreamContext):JournalScope=>({ownerId:options.scope.ownerId,valid:()=>valid()&&(!context||context.valid()),signal:context?.signal??abort.signal});
 const check=(context?:OrderedStreamContext)=>{if(!scope(context).valid())throw new JournalError('JOURNAL_CONTEXT_CHANGED');};
 const stop=()=>{if(stopped)return;stopped=true;generation++;if(progressDeadline)clearTimeout(progressDeadline);if(preparationDeadline)clearTimeout(preparationDeadline);abort.abort();transportStop?.();transportStop=undefined;options.scope.signal?.removeEventListener('abort',stop);};
 options.scope.signal?.addEventListener('abort',stop,{once:true});
 const fail=(reason:OrderedStreamFailure|'recovery',error?:unknown)=>{if(!valid()){stop();return;}stop();try{options.onError(reason,error);}catch{/* Reporting cannot resume a disposed owner scope. */}};
 const publish=(checkpoint:IngestCheckpoint,resync:boolean,context?:OrderedStreamContext)=>{check(context);if(current?.cursor!==checkpoint.cursor)reconnects=0;current=checkpoint;options.onCheckpoint(checkpoint,resync);};
 const prepare=async(forceResync=false,context?:OrderedStreamContext)=>{
  for(let attempt=0;attempt<3;attempt++){
   check(context);const saved=await journal.readCheckpoint(scope(context),jobId);check(context);
   let response;
   try{response=await api.getIngestRecovery!(jobId,saved.value&&!forceResync?{mode:'replay',cursor:saved.value.cursor}:{mode:'resync'},scope(context).signal);}
   catch(error){check(context);if(error instanceof AuthApiError&&['INGEST_CURSOR_INVALID','INGEST_CURSOR_JOB_MISMATCH','INGEST_CURSOR_AHEAD'].includes(error.code??''))response=await api.getIngestRecovery!(jobId,{mode:'resync'},scope(context).signal);else throw error;}
   check(context);response=parseIngestRecovery(response,jobId);knownHead=response.head_cursor;
   if(response.mode==='replay'){
    if(!saved.value||response.cursor!==saved.value.cursor)throw new IngestProtocolError();publish(saved.value,false,context);return;
   }
   const applied=await journal.commitResync(scope(context),jobId,response,saved.revision);check(context);
   if(!applied.value)throw new JournalError('JOURNAL_CORRUPT');
   if(applied.value.cursor!==response.cursor){forceResync=false;continue;}
   if(JSON.stringify(applied.value.snapshot)!==JSON.stringify(response.snapshot))throw new IngestProtocolError();
   publish(applied.value,true,context);return;
  }
  throw new JournalError('JOURNAL_CHECKPOINT_CHANGED');
 };
 const reconnect=()=>{generation++;if(progressDeadline)clearTimeout(progressDeadline);transportStop?.();transportStop=undefined;if(++reconnects>3){fail('consumer',new IngestProtocolError());return;}queueMicrotask(()=>{if(valid())void start();});};
 const connect=()=>{
  check();const initialCursor=current?.cursor,backlog=knownHead!==initialCursor||!!current&&['done','failed'].includes(current.snapshot.state);const stamp=++generation;
  if(backlog)progressDeadline=setTimeout(()=>{if(stamp===generation)fail("consumer",new Error("INGEST_REPLAY_PROGRESS_TIMEOUT"));},15000);const guarded=(context:OrderedStreamContext):OrderedStreamContext=>({...context,valid:()=>stamp===generation&&context.valid()});
  const stopStream=api.watchDurableIngest!(jobId,{
   cursor:()=>current?.cursor,
   shouldYield:()=>!!options.shouldYield?.()&&(!backlog||current?.cursor!==initialCursor),
   onYield:()=>{if(stamp!==generation||!valid())return;stop();options.onYield?.();},
   onEvent:async(value,context)=>{
    context=guarded(context);check(context);const event=parseIngestEvent(value,jobId);if(context.id!==event.cursor)throw new IngestProtocolError();
    const saved=await journal.commitEvent(scope(context),jobId,event);check(context);if(!saved.value)throw new JournalError('JOURNAL_CORRUPT');publish(saved.value,false,context);if(current?.cursor!==initialCursor&&progressDeadline){clearTimeout(progressDeadline);progressDeadline=undefined;}
   },
   onControl:async(value,context)=>{
    context=guarded(context);check(context);const control=parseIngestControl(value,jobId);
    if(control.kind==='resync'){await prepare(true,context);check(context);reconnect();return true;}
    const saved=await journal.readCheckpoint(scope(context),jobId);check(context);
    if(!saved.value)throw new JournalError('JOURNAL_CORRUPT');
    if(saved.value.cursor!==control.cursor||saved.value.snapshot.attempt!==control.attempt||saved.value.snapshot.state_version!==control.state_version){reconnect();return true;}
    if(!['done','failed'].includes(saved.value.snapshot.state))throw new IngestProtocolError();
    publish(saved.value,false,context);check(context);options.onComplete(saved.value);stop();return true;
   },
   onError:(reason)=>{if(stamp===generation)fail(reason);},
  });
  if(!valid()||stamp!==generation)stopStream();else transportStop=stopStream;
 };
 const start=async()=>{if(preparing||!valid())return;preparing=true;preparationDeadline=setTimeout(()=>fail('recovery',new Error('INGEST_RECOVERY_TIMEOUT')),10000);try{await prepare();check();connect();}catch(error){fail('recovery',error);}finally{if(preparationDeadline)clearTimeout(preparationDeadline);preparing=false;}};
 void start();return stop;
}
