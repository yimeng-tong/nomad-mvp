import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { AuthFault } from '../auth/errors.js';
import { runAsAcceptedJob } from '../auth/owner.js';
import { claimIngestExecution,renewIngestLease,releaseIngestLease,type IngestLease } from './execution-lease.js';
import type { IngestExecutionPolicy } from './execution-policy.js';
import { abortableIngestStep,runDurableIngestPipeline } from './durable-pipeline.js';
type Work={lease:IngestLease;failures:number};
export type IngestWorkerDependencies={
 claim:()=>Promise<Work|null>;execute:(lease:IngestLease,signal:AbortSignal)=>Promise<void>;
 renew:(lease:IngestLease)=>Promise<void>;release:(lease:IngestLease,delayMs:number)=>Promise<void>;
 report?:(code:string)=>void;
};
type Task={controller:AbortController;promise:Promise<void>};
/** One bounded claim loop, independently renewed leases, and cooperative shutdown before DB disconnect. */
export class IngestWorker {
 private running=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private claiming:Promise<void>|undefined;
 private closing:Promise<void>|undefined;
 private claimErrors=0;
 private tasks=new Map<string,Task>();
 constructor(private readonly policy:IngestExecutionPolicy,private readonly deps:IngestWorkerDependencies){
  if(!Number.isSafeInteger(policy.concurrency)||policy.concurrency<1||policy.concurrency>16||!Number.isSafeInteger(policy.pollMs)||policy.pollMs<100||policy.pollMs>30000
   ||!Number.isSafeInteger(policy.leaseMs)||policy.leaseMs<1000||policy.leaseMs>300000||!Number.isSafeInteger(policy.stepTimeoutMs)||policy.stepTimeoutMs<100||policy.stepTimeoutMs>300000)throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
 }
 start(){if(this.closing||this.running||this.policy.enabled!==true||this.policy.isolated!==false)return;this.running=true;this.wake();}
 wake(){if(!this.running||this.claiming)return;if(this.timer)clearTimeout(this.timer);this.timer=setTimeout(()=>this.tick(),0);this.timer.unref();}
 private report(error:unknown){
  if(error instanceof AuthFault&&['INGEST_LEASE_LOST','AUTH_ACCOUNT_UNAVAILABLE','AUTH_CONTEXT_CHANGED','INGEST_ATTEMPT_CHANGED','INGEST_STATE_CHANGED'].includes(error.code))return;
  try{this.deps.report?.('INGEST_WORKER_OPERATION_FAILED');}catch{/* Observability cannot alter durable work. */}
 }
 private tick(){
  this.timer=undefined;if(!this.running||this.claiming)return;
  this.claiming=(async()=>{
   while(this.running&&this.tasks.size<this.policy.concurrency){
    const work=await this.deps.claim();this.claimErrors=0;if(!work)break;
    if(!this.running){await this.deps.release(work.lease,0).catch(error=>this.report(error));break;}
    this.launch(work);
   }
  })().catch(error=>{this.claimErrors=Math.min(8,this.claimErrors+1);this.report(error);}).finally(()=>{
   this.claiming=undefined;
   if(this.running){this.timer=setTimeout(()=>this.tick(),Math.min(30000,this.policy.pollMs*2**this.claimErrors));this.timer.unref();}
  });
 }
 private launch(work:Work){
  const key=`${work.lease.jobId}:${work.lease.fence}`,controller=new AbortController();
  let renewalTimer:ReturnType<typeof setTimeout>|undefined,renewing:Promise<void>|undefined,finished=false;
  const scheduleRenewal=()=>{
   if(finished||!this.running||controller.signal.aborted)return;
   renewalTimer=setTimeout(()=>{
    renewalTimer=undefined;
    renewing=this.deps.renew(work.lease).catch(error=>{controller.abort();this.report(error);}).finally(()=>{renewing=undefined;scheduleRenewal();});
   },Math.max(100,Math.floor(this.policy.leaseMs/3)));renewalTimer.unref();
  };
  const task:Task={controller,promise:Promise.resolve()};this.tasks.set(key,task);
  scheduleRenewal();
  task.promise=Promise.resolve().then(()=>runAsAcceptedJob({ownerId:work.lease.ownerId,authVersion:work.lease.authVersion},()=>abortableIngestStep(controller.signal,()=>this.deps.execute(work.lease,controller.signal))))
   .catch(error=>{if(!controller.signal.aborted)this.report(error);}).finally(async()=>{
    finished=true;if(renewalTimer)clearTimeout(renewalTimer);await renewing;
    const delay=this.running?Math.min(30000,1000*2**Math.min(5,Math.max(0,work.failures-1))):0;
    await this.deps.release(work.lease,delay).catch(error=>this.report(error));
    this.tasks.delete(key);this.wake();
   });
 }
 stop():Promise<void>{
  if(this.closing)return this.closing;
  this.running=false;if(this.timer)clearTimeout(this.timer);this.timer=undefined;
  for(const task of this.tasks.values())task.controller.abort();
  this.closing=(async()=>{await this.claiming;await Promise.all([...this.tasks.values()].map(task=>task.promise));})();
  return this.closing;
 }
}
export function createIngestWorker(db:PrismaClient,policy:IngestExecutionPolicy,report?:(code:string)=>void){
 const workerId=randomUUID();
 return new IngestWorker(policy,{
  claim:async()=>{const work=await claimIngestExecution(db,workerId,policy);return work?{lease:work.lease,failures:work.row.executionFailureCount}:null;},
  execute:(lease,signal)=>runDurableIngestPipeline(lease,signal,{stepTimeoutMs:policy.stepTimeoutMs}),renew:lease=>renewIngestLease(db,lease,policy.leaseMs),release:(lease,delay)=>releaseIngestLease(db,lease,delay),report,
 });
}
