import { Prisma, type PrismaClient } from '@prisma/client';
import type { components } from '../../../../packages/types/src/api-types.js';
import { AuthFault } from '../auth/errors.js';
import { dbOwnerId, lockQualifiedOwner } from '../auth/owner.js';
import { getPrisma } from '../db/prisma.js';
import { encodeIngestCursor, resolveIngestCursor, selectIngestCursor } from './cursor.js';
import { eventFromRecord, type DurableIngestEvent } from './event-log.js';
import { getIngestSnapshot } from './store.js';

type Recovery = components['schemas']['IngestRecoveryResponse'];
type Control = components['schemas']['IngestControl'];
type Head = Pick<Prisma.IngestJobGetPayload<{}>, 'id'|'eventStreamId'|'lastEventSeq'|'replayFloorSeq'|'status'|'retryCount'|'stateVersion'>;
const unavailable = () => new AuthFault('INGEST_EVENT_STATE_UNAVAILABLE',503,true);
const PAGE_SIZE = 20;
export type IngestReplayPage = { mode:'replay'; events:DurableIngestEvent[]; cursor:string; headCursor:string; complete:Control|null }
  | {mode:'resync'; control:Control};

/** Every read, including tail polls, rechecks owner before any event payload is loaded. */
async function withHead<T>(userId:string,jobId:string,read:(tx:Prisma.TransactionClient,head:Head)=>Promise<T>):Promise<T> {
  // This existing qualified path also safely creates a single current-fact checkpoint for a legacy job.
  await getIngestSnapshot(userId,jobId);
  const db:PrismaClient|null=getPrisma();if(!db)throw unavailable();
  const ownerId=dbOwnerId(userId),id=jobId.replace(/^ing_/,'');
  return db.$transaction(async tx=>{
    await lockQualifiedOwner(tx,ownerId);
    const rows=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM "IngestJob" WHERE id=${id}::uuid AND "userId"=${ownerId}::uuid AND deleted_at IS NULL FOR SHARE`;
    if(!rows.length)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
    const head=await tx.ingestJob.findUniqueOrThrow({where:{id},select:{id:true,eventStreamId:true,lastEventSeq:true,replayFloorSeq:true,status:true,retryCount:true,stateVersion:true}});
    if(!head.eventStreamId||head.lastEventSeq<1n)throw unavailable();
    // The job lock keeps head/floor/snapshot consistent with this bounded event read.
    return read(tx,head);
  });
}
function position(head:Head){return {streamId:head.eventStreamId!,head:head.lastEventSeq,floor:head.replayFloorSeq};}
function control(head:Head,kind:'complete'|'resync'):Control {
  return {kind,ingest_id:`ing_${head.id}`,cursor:encodeIngestCursor(head.eventStreamId!,head.lastEventSeq),attempt:head.retryCount+1,state_version:head.stateVersion};
}
async function snapshotAtHead(tx:Prisma.TransactionClient,head:Head){
  const row=await tx.ingestEventRecord.findUnique({where:{jobId_seq:{jobId:head.id,seq:head.lastEventSeq}}});
  if(!row)throw unavailable();
  const event=eventFromRecord(row,head.eventStreamId!);
  if(event.attempt!==head.retryCount+1||event.state_version!==head.stateVersion||event.state!==head.status)throw unavailable();
  return event.snapshot;
}
export function readIngestRecovery(userId:string,jobId:string,input:{mode?:unknown;cursor?:unknown;headerCursor?:unknown}={}):Promise<Recovery> {
  return withHead(userId,jobId,async(tx,head)=>{
    const mode=input.mode===undefined?'replay':input.mode;if(mode!=='replay'&&mode!=='resync')throw new AuthFault('INGEST_RECOVERY_MODE_INVALID',400);
    const cursor=selectIngestCursor(input.headerCursor,input.cursor);
    if(mode==='resync'&&cursor!==undefined)throw new AuthFault('INGEST_CURSOR_INVALID',400);
    const resolved=resolveIngestCursor(cursor,position(head));
    const base={ingest_id:`ing_${head.id}`,head_cursor:encodeIngestCursor(head.eventStreamId!,head.lastEventSeq),head_seq:head.lastEventSeq.toString(),replay_floor:head.replayFloorSeq.toString()};
    if(mode==='resync'||resolved.mode==='resync')return {...base,mode:'resync',reason:mode==='resync'?'checkpoint_missing':'retention',cursor:base.head_cursor,snapshot:await snapshotAtHead(tx,head)};
    return {...base,mode:'replay',cursor:resolved.cursor};
  });
}
/** A single page is bounded by event count and encoded bytes; the caller controls send pacing/backpressure. */
export function readIngestReplayPage(userId:string,jobId:string,cursor?:unknown):Promise<IngestReplayPage> {
  return withHead(userId,jobId,async(tx,head)=>{
    const resolved=resolveIngestCursor(cursor,position(head));
    if(resolved.mode==='resync')return {mode:'resync',control:control(head,'resync')};
    const records=await tx.ingestEventRecord.findMany({where:{jobId:head.id,seq:{gt:resolved.after,lte:head.lastEventSeq}},orderBy:{seq:'asc'},take:PAGE_SIZE});
    const events:DurableIngestEvent[]=[];let after=resolved.after,bytes=0;
    for(const record of records){
      if(record.seq!==after+1n)throw unavailable();
      const event=eventFromRecord(record,head.eventStreamId!),size=Buffer.byteLength(JSON.stringify(event));
      if(size>60*1024)throw unavailable();
      if(bytes+size>256*1024)break;
      events.push(event);bytes+=size;after=record.seq;
    }
    if(!events.length&&after<head.lastEventSeq)throw unavailable();
    return {mode:'replay',events,cursor:encodeIngestCursor(head.eventStreamId!,after),headCursor:encodeIngestCursor(head.eventStreamId!,head.lastEventSeq),
      complete:after===head.lastEventSeq&&['done','failed'].includes(head.status)?control(head,'complete'):null};
  });
}


/** Hold qualification and the job head through the terminal control write/close boundary. */
export function withIngestTerminalHead(userId:string,jobId:string,expected:Control,send:()=>Promise<void>):Promise<boolean>{
 return withHead(userId,jobId,async(_tx,head)=>{
  if(expected.kind!=='complete'||expected.ingest_id!==`ing_${head.id}`||expected.attempt!==head.retryCount+1||expected.state_version!==head.stateVersion
   ||expected.cursor!==encodeIngestCursor(head.eventStreamId!,head.lastEventSeq)||!['done','failed'].includes(head.status))return false;
  await send();return true;
 });
}
