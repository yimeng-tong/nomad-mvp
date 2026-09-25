import type {components} from 'nomad-types/src/api-types';
export type IngestSnapshot=components['schemas']['IngestSnapshot'];
export type IngestEvent=components['schemas']['IngestDurableEvent'];
export type IngestControl=components['schemas']['IngestControl'];
export type IngestRecovery=components['schemas']['IngestRecoveryResponse'];
export class IngestProtocolError extends Error {
 constructor(readonly code:'INGEST_PROTOCOL_INVALID'|'INGEST_CHECKPOINT_CHANGED'|'INGEST_EVENT_GAP'='INGEST_PROTOCOL_INVALID'){super(code);}
}
const invalid=()=>new IngestProtocolError();
const object=(value:unknown):Record<string,unknown>=>{if(!value||typeof value!=='object'||Array.isArray(value))throw invalid();return value as Record<string,unknown>;};
const integer=(value:unknown,min=0):number=>{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min)throw invalid();return value;};
const bool=(value:unknown):boolean=>{if(typeof value!=='boolean')throw invalid();return value;};
const nullableText=(value:unknown,max:number):string|null=>{if(value===null)return null;if(typeof value!=='string'||value.length>max)throw invalid();return value;};
const timestamp=(value:unknown):string=>{if(typeof value!=='string'||value.length>40||!Number.isFinite(Date.parse(value)))throw invalid();return value;};
const states=['created','fetching','parsing','geo','storing','done','failed'] as const;
const stages=['media_prep','speech_detect','frame_extract','asr','multimodal'] as const;
const legacyStages=['text','ocr','vision'];
export function validIngestJobId(value:unknown):value is string {return typeof value==='string'&&value.length===40&&/^ing_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);}
export function parseIngestCursor(value:unknown):{streamId:string;seq:bigint}{
 if(typeof value!=='string'||value.length>128)throw invalid();
 const match=/^i1:([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):(0|[1-9][0-9]{0,18})$/.exec(value);
 if(!match||match[0].length!==value.length)throw invalid();const seq=BigInt(match[2]);if(seq>9223372036854775807n)throw invalid();return {streamId:match[1],seq};
}
/** Only known facts are copied into device storage. Legacy diagnostic names display as generic parsing. */
export function parseIngestSnapshot(value:unknown,jobId:string,cursor:string):IngestSnapshot {
 if(!validIngestJobId(jobId))throw invalid();parseIngestCursor(cursor);
 const raw=object(value),actions=object(raw.actions);if(raw.ingest_id!==jobId||raw.head_cursor!==cursor||!states.includes(raw.state as any))throw invalid();
 const state=raw.state as IngestSnapshot['state'],attempt=integer(raw.attempt,1),version=integer(raw.state_version),partial=bool(raw.partial),retriable=bool(raw.retriable);
 const sub=raw.sub_stage??null;
 if(sub!==null&&(typeof sub!=='string'||![...stages,...legacyStages].includes(sub)||state!=='parsing'))throw invalid();
 const sub_stage=typeof sub==='string'&&stages.includes(sub as any)?sub as NonNullable<IngestSnapshot['sub_stage']>:null;
 let result:IngestSnapshot['result']=null;
 if(raw.result!==null){const saved=object(raw.result);if(typeof saved.inspiration_id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(saved.inspiration_id)||/[\r\n]/.test(saved.inspiration_id)||!['resolved','pending'].includes(saved.locate_status as string))throw invalid();
  result={inspiration_id:saved.inspiration_id,locate_status:saved.locate_status as 'resolved'|'pending',asset_count:integer(saved.asset_count),city_name:nullableText(saved.city_name,240)};
 }
 if(bool(actions.retry)!==retriable||bool(actions.view)!==!!result||retriable&&state!=='failed')throw invalid();
 const error=raw.error_code??null;if(error!==null&&(typeof error!=='string'||!/^INGEST_[A-Z_]{1,80}$/.test(error)||/[\r\n]/.test(error)))throw invalid();
 const snapshot:IngestSnapshot={ingest_id:jobId,head_cursor:cursor,attempt,state_version:version,state,sub_stage,source_title:nullableText(raw.source_title,240),partial,retriable,
  error_code:error,updated_at:timestamp(raw.updated_at),result,actions:{retry:retriable,view:!!result}};
 for(const key of ['fetched_count','parsed_count','candidate_count','stored_count'] as const)snapshot[key]=raw[key]===null||raw[key]===undefined?null:integer(raw[key]);
 if(state==='done'&&(!result||!snapshot.stored_count))throw invalid();return snapshot;
}
export function parseIngestEvent(value:unknown,jobId:string):IngestEvent {
 const raw=object(value),cursor=raw.cursor;const position=parseIngestCursor(cursor);
 if(raw.schema_version!==1||!['fact','checkpoint'].includes(raw.kind as string)||position.seq<1n||raw.seq!==position.seq.toString())throw invalid();
 const snapshot=parseIngestSnapshot(raw.snapshot,jobId,cursor as string),at=timestamp(raw.occurred_at);
 if(raw.ingest_id!==jobId||raw.attempt!==snapshot.attempt||raw.retry!==snapshot.attempt-1||raw.state_version!==snapshot.state_version||raw.stage!==snapshot.state||raw.state!==snapshot.state||raw.ts!==Date.parse(at))throw invalid();
 if(typeof raw.trace_id!=='string'||raw.trace_id.length!==36||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.trace_id))throw invalid();
 for(const key of ['fetched_count','parsed_count','candidate_count','stored_count'] as const)if(raw[key]!==undefined&&raw[key]!==snapshot[key])throw invalid();
 if(raw.retriable!==undefined&&raw.retriable!==snapshot.retriable||raw.error_code!==undefined&&raw.error_code!==snapshot.error_code)throw invalid();
 const top=raw.sub_stage??null,normalized=typeof top==='string'&&legacyStages.includes(top)?null:top;if(normalized!==(snapshot.sub_stage??null))throw invalid();
 return {schema_version:1,kind:raw.kind as 'fact'|'checkpoint',ingest_id:jobId,cursor:cursor as string,seq:position.seq.toString(),attempt:snapshot.attempt,retry:snapshot.attempt-1,
  state_version:snapshot.state_version,state:snapshot.state,stage:snapshot.state,sub_stage:snapshot.sub_stage??undefined,trace_id:raw.trace_id,occurred_at:at,ts:Date.parse(at),snapshot};
}
export function parseIngestControl(value:unknown,jobId:string):IngestControl {
 const raw=object(value);if(!validIngestJobId(jobId)||raw.ingest_id!==jobId||!['complete','resync'].includes(raw.kind as string))throw invalid();parseIngestCursor(raw.cursor);
 return {kind:raw.kind as 'complete'|'resync',ingest_id:jobId,cursor:raw.cursor as string,attempt:integer(raw.attempt,1),state_version:integer(raw.state_version)};
}
export function parseIngestRecovery(value:unknown,jobId:string):IngestRecovery {
 const raw=object(value);if(!validIngestJobId(jobId)||raw.ingest_id!==jobId||!['replay','resync'].includes(raw.mode as string))throw invalid();
 const head=parseIngestCursor(raw.head_cursor),cursor=parseIngestCursor(raw.cursor);
 const floor=parseIngestCursor(`i1:${head.streamId}:${String(raw.replay_floor)}`);
 if(typeof raw.head_seq!=='string'||typeof raw.replay_floor!=='string'||raw.head_seq!==head.seq.toString()||cursor.streamId!==head.streamId||cursor.seq>head.seq||floor.seq>head.seq||cursor.seq<floor.seq)throw invalid();
 const base={ingest_id:jobId,cursor:raw.cursor as string,head_cursor:raw.head_cursor as string,head_seq:head.seq.toString(),replay_floor:floor.seq.toString()};
 if(raw.mode==='replay')return {...base,mode:'replay'};
 if(head.seq<1n||!['retention','checkpoint_missing'].includes(raw.reason as string)||raw.cursor!==raw.head_cursor)throw invalid();
 return {...base,mode:'resync',reason:raw.reason as 'retention'|'checkpoint_missing',snapshot:parseIngestSnapshot(raw.snapshot,jobId,base.cursor)};
}
