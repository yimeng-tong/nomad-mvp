import { Prisma, type PrismaClient } from '@prisma/client';
import { AuthFault } from '../auth/errors.js';
import { actorContext, lockQualifiedOwner } from '../auth/owner.js';
import type { IngestExecutionPolicy } from './execution-policy.js';
export type IngestLease = Readonly<{ jobId:string; ownerId:string; authVersion:number; attempt:number; workerId:string; fence:bigint }>;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const lost=()=>new AuthFault('INGEST_LEASE_LOST',409,false);
function validToken(token:IngestLease) {
 if(!token||![token.jobId,token.ownerId,token.workerId].every(value=>typeof value==='string'&&value.length===36&&uuid.test(value))
  ||!Number.isSafeInteger(token.attempt)||token.attempt<1||!Number.isSafeInteger(token.authVersion)||token.authVersion<0
  ||typeof token.fence!=='bigint'||token.fence<1n)throw lost();
}
function transactionOnly(tx:Prisma.TransactionClient){if(typeof (tx as unknown as {$transaction?:unknown}).$transaction!=='undefined')throw new AuthFault('INGEST_TRANSACTION_REQUIRED',503);}

/** Internal scheduler operation; never expose returned owned rows as an HTTP resource. */
export async function claimIngestExecution(db:PrismaClient,workerId:string,policy:IngestExecutionPolicy) {
 if(policy.enabled!==true||policy.isolated!==false)return null;
 if(typeof workerId!=='string'||!uuid.test(workerId)||workerId.length!==36||!Number.isSafeInteger(policy.leaseMs)||policy.leaseMs<1000||policy.leaseMs>300000)throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
 return actorContext.run(undefined,()=>db.$transaction(async tx=>{
  // Candidate discovery holds no job lock: every mutation uses owner -> job lock order.
  let afterId:string|null=null;
  for (;;) {
  const candidates:Array<{id:string;userId:string;auth_version:number}>=await tx.$queryRaw`
    SELECT j.id,j."userId",j.auth_version FROM "IngestJob" j JOIN "User" u ON u.id=j."userId"
    WHERE j.deleted_at IS NULL AND j.execution_pending AND j.status NOT IN ('done','failed') AND j.event_stream_id IS NOT NULL
      AND u.auth_state='active' AND u.auth_version=j.auth_version
      AND (j.next_execution_at IS NULL OR j.next_execution_at<=clock_timestamp())
      AND (j.lease_expires_at IS NULL OR j.lease_expires_at<=clock_timestamp())
      AND (${afterId}::uuid IS NULL OR j.id>${afterId}::uuid)
    ORDER BY j.id LIMIT 32 FOR SHARE OF u SKIP LOCKED`;
  if(!candidates.length)return null;
  afterId=candidates[candidates.length-1].id;
  for(const candidate of candidates){
   try {await lockQualifiedOwner(tx,candidate.userId,candidate.auth_version);}
   catch(error){if(error instanceof AuthFault&&['AUTH_ACCOUNT_UNAVAILABLE','AUTH_CONTEXT_CHANGED'].includes(error.code))continue;throw error;}
   const locked=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM "IngestJob" WHERE id=${candidate.id}::uuid FOR UPDATE SKIP LOCKED`;
   if(!locked.length)continue;
   const changed=await tx.$queryRaw<Array<{id:string}>>`UPDATE "IngestJob" SET lease_owner=${workerId}::uuid,
     lease_fence=lease_fence+1,execution_failure_count=least(execution_failure_count+1,5),lease_expires_at=clock_timestamp()+${policy.leaseMs}*interval '1 millisecond'
     WHERE id=${candidate.id}::uuid AND "userId"=${candidate.userId}::uuid AND deleted_at IS NULL AND auth_version=${candidate.auth_version}
       AND execution_pending AND status NOT IN ('done','failed') AND event_stream_id IS NOT NULL
       AND lease_fence<9223372036854775807
       AND (next_execution_at IS NULL OR next_execution_at<=clock_timestamp())
       AND (lease_expires_at IS NULL OR lease_expires_at<=clock_timestamp()) RETURNING id`;
   if(!changed.length)continue;
   const row=await tx.ingestJob.findUniqueOrThrow({where:{id:candidate.id}});
   const lease:IngestLease=Object.freeze({jobId:row.id,ownerId:row.userId,authVersion:row.authVersion!,attempt:row.retryCount+1,workerId,fence:row.leaseFence});
   return {row,lease};
  }
  if(candidates.length<32)return null;
  }
 }));
}

/** Validate AFTER acquiring the row lock; wall time spent waiting for that lock does not extend authority. */
export async function lockIngestLease(tx:Prisma.TransactionClient,token:IngestLease){
 transactionOnly(tx);validToken(token);await lockQualifiedOwner(tx,token.ownerId,token.authVersion);
 await tx.$queryRaw`SELECT id FROM "IngestJob" WHERE id=${token.jobId}::uuid AND "userId"=${token.ownerId}::uuid FOR UPDATE`;
 const valid=await tx.$queryRaw<Array<{id:string}>>(Prisma.sql`SELECT id FROM "IngestJob" WHERE ${ingestLeasePredicate(token)}`);
 if(!valid.length)throw lost();
 return tx.ingestJob.findUniqueOrThrow({where:{id:token.jobId}});
}
/** Reuse at the mutating SQL statement, so time spent after validation cannot extend authority. */
export function ingestLeasePredicate(token:IngestLease):Prisma.Sql {
 validToken(token);
 return Prisma.sql`id=${token.jobId}::uuid AND "userId"=${token.ownerId}::uuid AND deleted_at IS NULL
  AND auth_version=${token.authVersion} AND retry_count=${token.attempt-1} AND execution_pending
  AND status NOT IN ('done','failed') AND lease_owner=${token.workerId}::uuid AND lease_fence=${token.fence}
  AND lease_expires_at>clock_timestamp()`;
}
export async function renewIngestLease(db:PrismaClient,token:IngestLease,leaseMs:number){
 if(!Number.isSafeInteger(leaseMs)||leaseMs<1000||leaseMs>300000)throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
 return db.$transaction(async tx=>{await lockIngestLease(tx,token);
  const changed=await tx.$executeRaw(Prisma.sql`UPDATE "IngestJob" SET lease_expires_at=clock_timestamp()+${leaseMs}*interval '1 millisecond' WHERE ${ingestLeasePredicate(token)}`);
  if(changed!==1)throw lost();
 });
}
/** Relinquish only this still-valid execution; an expired/old worker cannot erase a successor's lease. */
export async function releaseIngestLease(db:PrismaClient,token:IngestLease,delayMs=0){
 if(!Number.isSafeInteger(delayMs)||delayMs<0||delayMs>300000)throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
 return db.$transaction(async tx=>{await lockIngestLease(tx,token);
  const changed=await tx.$executeRaw(Prisma.sql`UPDATE "IngestJob" SET lease_owner=NULL,lease_expires_at=NULL,
   next_execution_at=clock_timestamp()+${delayMs}*interval '1 millisecond' WHERE ${ingestLeasePredicate(token)}`);
  if(changed!==1)throw lost();
 });
}
export async function markIngestPending(tx:Prisma.TransactionClient,jobId:string){
 transactionOnly(tx);
 const row=await tx.ingestJob.findUniqueOrThrow({where:{id:jobId}});
 if(row.deletedAt)throw new AuthFault('INGEST_JOB_NOT_FOUND',404);
 if(row.authVersion===null||!row.eventStreamId)throw new AuthFault('INGEST_EXECUTION_UNAVAILABLE',503);
 await lockQualifiedOwner(tx,row.userId,row.authVersion);
 if(row.executionPending)return row;
 if(row.status!=='created')throw new AuthFault('INGEST_EXECUTION_UNAVAILABLE',503);
 if(row.leaseOwner!==null||row.leaseExpiresAt!==null)throw new AuthFault('INGEST_EXECUTION_UNAVAILABLE',503);
 const result=await tx.ingestJob.updateMany({where:{id:jobId,deletedAt:null,stateVersion:row.stateVersion,lastEventSeq:row.lastEventSeq,status:'created',executionPending:false,leaseOwner:null},
  data:{executionPending:true,nextExecutionAt:null,leaseOwner:null,leaseExpiresAt:null,checkpointJson:Prisma.DbNull,checkpointVersion:0,executionFailureCount:0}});
 if(result.count!==1)throw new AuthFault('INGEST_STATE_CHANGED',409);
 return tx.ingestJob.findUniqueOrThrow({where:{id:jobId}});
}
