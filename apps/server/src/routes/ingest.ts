import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { authGuard } from '../plugins/auth.js';
import { IngestStartBody, IngestXhsBody } from '../schemas.js';
import { parseXhsInput } from '../ingest/link-parser.js';
import { acceptIngestCommand, assertIngestSchema, getJob, getIngestSnapshot, getIngestResult, readIngestCommand, retryIngestCommand } from '../ingest/store.js';
import { assertIngestCapability, startIngestPipeline } from '../ingest/pipeline.js';
import { createAuthorizedSse } from '../auth/sse.js';
import { streamDurableIngest,type IngestStreamRegistry } from '../ingest/event-stream.js';
import { readIngestRecovery } from '../ingest/event-replay.js';
import { AuthFault } from '../auth/errors.js';
import { getPrisma } from '../db/prisma.js';
import { resolveIngestExecutionPolicy } from '../ingest/execution-policy.js';
import { createIngestWorker,type IngestWorker } from '../ingest/worker.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const workers=new WeakMap<FastifyInstance,IngestWorker>();
export async function stopIngestWorker(app:FastifyInstance){await workers.get(app)?.stop();}
async function safe(reply: FastifyReply, work: () => Promise<unknown>) {
  try { return await work(); }
  catch (error) {
    const fault = error instanceof AuthFault ? error : new AuthFault('INGEST_STATE_UNAVAILABLE',503,true);
    return reply.sendError(fault.code,fault.code,fault.status,fault.retriable);
  }
}
async function start(req: FastifyRequest, reply: FastifyReply, input: {url?:string|null;share_text?:string|null;operation_id?:string}, dispatch:(jobId:string)=>void,canDispatch:()=>void,legacy=false) {
  const parsed = parseXhsInput(input);
  if (!parsed.url) throw new AuthFault('INGEST_XHS_URL_REQUIRED',400);
  const operationId = input.operation_id ?? randomUUID();
  const accepted = await acceptIngestCommand({userId:req.user!.id,sourceUrl:parsed.url,traceId:req.traceId || randomUUID(),operationId,warning:parsed.warning,canDispatch});
  // Do not place a fallible read between committed acceptance and the winner's dispatch.
  if (accepted.shouldRun) dispatch(accepted.job.id);
  const snapshot = accepted.job.legacySnapshot ? await getIngestSnapshot(req.user!.id,accepted.job.id) : accepted.job.snapshot!;
  return reply.code(202).send({ingest_id:accepted.job.id,state:snapshot.state,operation_id:operationId,disposition:accepted.disposition,snapshot,
    sse_url:legacy?`/sse/ingest/${accepted.job.id}`:`/ingest/${accepted.job.id}/events`,warning:parsed.warning});
}
async function stream(req: FastifyRequest,reply:FastifyReply,jobId:string,registry:IngestStreamRegistry) {
  if(getPrisma())return streamDurableIngest(req,reply,jobId,registry);
  await getIngestSnapshot(req.user!.id,jobId); // Initial ownership/availability before opening a stream.
  reply.raw.setHeader('Cache-Control','no-store'); reply.raw.setHeader('Content-Type','text/event-stream');
  const sender=createAuthorizedSse(req,reply); let version=-1,closed=false,polling=false;
  let timer:ReturnType<typeof setInterval>|undefined;
  const close=()=>{closed=true;if(timer)clearInterval(timer);sender.close();};
  const read=async()=>{
    if(closed||polling)return;polling=true;
    try {
      const snapshot=await getIngestSnapshot(req.user!.id,jobId);
      if(snapshot.state_version>version){
        version=snapshot.state_version;
        if(!await sender.send({event:'ingest',data:JSON.stringify({ingest_id:jobId,trace_id:req.traceId || getJob(jobId)?.traceId || randomUUID(),state:snapshot.state,retry:snapshot.attempt-1,
          attempt:snapshot.attempt,state_version:version,snapshot,stored_count:snapshot.stored_count??undefined,ts:Date.now()})})){close();return;}
      } else if(!await sender.send({event:'ping',data:JSON.stringify({ts:Date.now()})})){close();return;}
      if(['done','failed'].includes(snapshot.state))close();
    }catch{close();}finally{polling=false;}
  };
  reply.raw.once('close',close); reply.raw.once('finish',close);
  const cached = getJob(jobId);
  for (const event of (cached?.legacySnapshot ? [] : cached?.events) ?? []) {
    if (event.attempt !== cached?.snapshot?.attempt || event.state_version === undefined || event.state_version <= version) continue;
    if (!await sender.send({event:'ingest',data:JSON.stringify(event)})) {close();return;}
    version=event.state_version;
  }
  await read(); if(!closed){timer=setInterval(()=>void read(),1000);timer.unref();}
}
const retryBody=z.object({operation_id:z.string().uuid(),expected_attempt:z.number().int().positive(),expected_state_version:z.number().int().nonnegative()}).strict();
export default fp(async(app)=>{
  const streamRegistry:IngestStreamRegistry={closing:false,tasks:new Set()};
  app.addHook('preClose',async()=>{streamRegistry.closing=true;const pending=[...streamRegistry.tasks];for(const task of pending)task.close();await Promise.all(pending.map(task=>task.finished));});
  const policy=resolveIngestExecutionPolicy(process.env),db=getPrisma();
  const canDispatch=()=>{assertIngestCapability();if(db&&!policy.enabled)throw new AuthFault('INGEST_EXECUTION_UNAVAILABLE',503,true);};
  const dispatch=(jobId:string)=>{if(db)workers.get(app)?.wake();else startIngestPipeline(jobId);};
  app.addHook('onReady',async()=>{await assertIngestSchema();if(db&&policy.enabled){assertIngestCapability();const worker=createIngestWorker(db,policy,code=>app.log.warn({code},'ingest worker operation failed'));workers.set(app,worker);worker.start();}});
  app.addHook('onClose',()=>stopIngestWorker(app));
  app.post('/ingest/xhs',{preHandler:authGuard},async(req,reply)=>safe(reply,async()=>{
    const parsed=IngestXhsBody.safeParse(req.body); if(!parsed.success)throw new AuthFault('INGEST_PARAMS_INVALID',400);
    return start(req,reply,parsed.data,dispatch,canDispatch);
  }));
  app.post('/ingest/start',{preHandler:authGuard},async(req,reply)=>safe(reply,async()=>{
    const parsed=IngestStartBody.safeParse(req.body);if(!parsed.success)throw new AuthFault('INGEST_PARAMS_INVALID',400);
    if(parsed.data.force)throw new AuthFault('INGEST_FORCE_UNSUPPORTED',400);
    return start(req,reply,parsed.data,dispatch,canDispatch,true);
  }));
  app.get<{Params:{jobId:string}}>('/ingest/:jobId',{preHandler:authGuard},async(req,reply)=>safe(reply,()=>getIngestSnapshot(req.user!.id,req.params.jobId)));
  app.get<{Params:{jobId:string};Querystring:{mode?:unknown;last_event_id?:unknown}}>('/ingest/:jobId/recovery',{preHandler:authGuard},async(req,reply)=>safe(reply,async()=>{
    reply.header('Cache-Control','no-store');
    return readIngestRecovery(req.user!.id,req.params.jobId,{mode:req.query.mode,cursor:req.query.last_event_id,headerCursor:req.headers['last-event-id']});
  }));
  app.get<{Params:{jobId:string}}>('/ingest/:jobId/result',{preHandler:authGuard},async(req,reply)=>safe(reply,()=>getIngestResult(req.user!.id,req.params.jobId)));
  app.get<{Params:{operationId:string}}>('/ingest/commands/:operationId',{preHandler:authGuard},async(req,reply)=>safe(reply,async()=>{
    const result=await readIngestCommand(req.user!.id,req.params.operationId);return {...result,state:result.snapshot.state};
  }));
  app.post<{Params:{jobId:string}}>('/ingest/:jobId/retry',{preHandler:authGuard},async(req,reply)=>safe(reply,async()=>{
    const parsed=retryBody.safeParse(req.body);if(!parsed.success)throw new AuthFault('INGEST_PARAMS_INVALID',400);
    const accepted=await retryIngestCommand({userId:req.user!.id,jobId:req.params.jobId,operationId:parsed.data.operation_id,
      expectedAttempt:parsed.data.expected_attempt,expectedVersion:parsed.data.expected_state_version,canDispatch});
    if(accepted.shouldRun)dispatch(accepted.job.id);
    const snapshot=accepted.job.snapshot!;
    return {ingest_id:accepted.job.id,state:snapshot.state,operation_id:parsed.data.operation_id,disposition:accepted.disposition,snapshot,sse_url:`/ingest/${accepted.job.id}/events`};
  }));
  app.get<{Params:{jobId:string}}>('/ingest/:jobId/events',{preHandler:authGuard},async(req,reply)=>safe(reply,()=>stream(req,reply,req.params.jobId,streamRegistry)));
  app.get<{Params:{id:string}}>('/sse/ingest/:id',{preHandler:authGuard},async(req,reply)=>safe(reply,()=>stream(req,reply,req.params.id,streamRegistry)));
});
