import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthFault } from '../auth/errors.js';
import { appendSnapshotEvent } from './event-log.js';
import { ingestLeasePredicate, lockIngestLease, type IngestLease } from './execution-lease.js';
import { advanceSnapshot, type IngestPatch, type IngestSnapshot } from './job-state.js';
const text=z.string().max(4096),finite=z.number().finite();
const dimensions={width:z.number().int().positive().optional(),height:z.number().int().positive().optional(),format:z.string().max(32).optional()};
const candidate=z.object({name:text,address:text.optional(),amapId:text.optional(),lat:finite.min(-90).max(90).optional(),lon:finite.min(-180).max(180).optional(),distanceMeters:finite.nonnegative().optional(),confidence:finite.min(0).max(1).optional(),cityName:text.optional()}).strict();
export const checkpointPhases=['ready','fetched','extracted','standardized','rehosted','saved'] as const;
const flightForPhase={ready:'fetch',fetched:'extract',extracted:'geo',standardized:'rehost',rehosted:null,saved:null} as const;
const schema=z.object({version:z.literal(1),adapterRevision:z.literal('fixture-v1'),attempt:z.number().int().positive(),phase:z.enum(checkpointPhases),
 inFlight:z.enum(['fetch','extract','geo','rehost']).nullable(),inFlightReplayable:z.boolean().nullable(),partial:z.boolean(),diagnostic:z.string().regex(/^INGEST_[A-Z_]{1,80}$/).optional(),
 post:z.object({title:text,text:z.string().max(1024*1024),media:z.array(z.object({url:text,kind:z.enum(['image','video']),...dimensions}).strict()).max(256)}).strict().optional(),
 extracted:z.array(z.object({name:text,authorClue:text.optional(),evidenceSource:text,confidence:finite.min(0).max(1)}).strict()).max(256).optional(),
 standardized:z.object({highConfidence:candidate.optional(),candidates:z.array(candidate).max(256)}).strict().optional(),
 assets:z.array(z.object({kind:z.string().max(64),cosKey:text,sha256:z.string().max(128).optional(),...dimensions}).strict()).max(256).optional(),
}).strict().superRefine((value,ctx)=>{
 const index=checkpointPhases.indexOf(value.phase);
 if((value.inFlight===null)!==(value.inFlightReplayable===null)||(value.inFlight!==null&&value.inFlight!==flightForPhase[value.phase])||index>=1&&!value.post||index>=2&&!value.extracted||index>=3&&!value.standardized||index>=4&&!value.assets)
  ctx.addIssue({code:z.ZodIssueCode.custom,message:'incomplete checkpoint'});
});
export type IngestExecutionCheckpoint=z.infer<typeof schema>;
type Row=Prisma.IngestJobGetPayload<{}>;
const invalid=()=>new AuthFault('INGEST_CHECKPOINT_INVALID',503,false);
export function parseIngestCheckpoint(value:unknown,attempt:number):IngestExecutionCheckpoint {
 const result=schema.safeParse(value);if(!result.success||result.data.attempt!==attempt)throw invalid();
 if(Buffer.byteLength(JSON.stringify(result.data))>2*1024*1024)throw invalid();
 return result.data;
}
export function checkpointFromRow(row:Row):IngestExecutionCheckpoint {
 if(row.checkpointJson===null){
  if(row.checkpointVersion!==0||row.status!=='created')throw invalid();
  return {version:1,adapterRevision:'fixture-v1',attempt:row.retryCount+1,phase:'ready',inFlight:null,inFlightReplayable:null,partial:false};
 }
 if(row.checkpointVersion<1)throw invalid();
 const checkpoint=parseIngestCheckpoint(row.checkpointJson,row.retryCount+1);
 const allowed={ready:['created','fetching'],fetched:['parsing'],extracted:['parsing','geo'],standardized:['storing'],rehosted:['storing'],saved:['storing']}[checkpoint.phase];
 if(!allowed.includes(row.status)||checkpoint.phase==='saved'&&!(row.snapshotJson as unknown as IngestSnapshot)?.result)throw invalid();
 return checkpoint;
}
/** Caller must append its matching snapshot/event in this same transaction. Never commits independently. */
export async function writeIngestCheckpoint(tx:Prisma.TransactionClient,row:Row,input:IngestExecutionCheckpoint,lease:IngestLease){
 const next=parseIngestCheckpoint(input,lease.attempt),before=checkpointFromRow(row);
 if(lease.jobId!==row.id||lease.attempt!==row.retryCount+1)throw new AuthFault('INGEST_CHECKPOINT_CHANGED',409);
 const oldIndex=checkpointPhases.indexOf(before.phase),newIndex=checkpointPhases.indexOf(next.phase);
 if(newIndex<oldIndex||newIndex>oldIndex+1||newIndex===oldIndex&&(before.inFlight!==null||next.inFlight!==flightForPhase[before.phase])
  ||newIndex===oldIndex+1&&(next.inFlight!==null||flightForPhase[before.phase]!==null&&before.inFlight!==flightForPhase[before.phase])||before.partial&&!next.partial||row.checkpointVersion>=2147483647)throw new AuthFault('INGEST_CHECKPOINT_CHANGED',409);
 const changed=await tx.$executeRaw(Prisma.sql`UPDATE "IngestJob" SET checkpoint_json=${JSON.stringify(next)}::jsonb,checkpoint_version=checkpoint_version+1,
  execution_failure_count=0 WHERE ${ingestLeasePredicate(lease)} AND checkpoint_version=${row.checkpointVersion}`);
 if(changed!==1)throw new AuthFault('INGEST_LEASE_LOST',409);
 return next;
}
export async function commitIngestCheckpoint(db:PrismaClient,lease:IngestLease,checkpoint:IngestExecutionCheckpoint,patch:IngestPatch){
 return db.$transaction(async tx=>{
  const row=await lockIngestLease(tx,lease);
  if(!row.snapshotJson)throw invalid();
  const next=await writeIngestCheckpoint(tx,row,checkpoint,lease);
  const snapshot=advanceSnapshot(row.snapshotJson as unknown as IngestSnapshot,patch,lease.attempt);
  const committed=await appendSnapshotEvent(tx,row,snapshot,'fact',lease);
  return {checkpoint:next,snapshot:committed.event.snapshot};
 });
}
