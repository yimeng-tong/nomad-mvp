import type {FastifyReply,FastifyRequest} from 'fastify';
import {AuthFault} from '../auth/errors.js';
import {createAuthorizedSse} from '../auth/sse.js';
import {getIngestSnapshot} from './store.js';
import {selectIngestCursor} from './cursor.js';
import {readIngestReplayPage,withIngestTerminalHead,type IngestReplayPage} from './event-replay.js';
export type IngestStreamTask={close:()=>void;finished:Promise<void>};
export type IngestStreamRegistry={closing:boolean;tasks:Set<IngestStreamTask>};
const delay=(ms:number,signal:AbortSignal)=>new Promise<void>(resolve=>{
 if(signal.aborted){resolve();return;}
 const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};
 const timer=setTimeout(done,Math.max(0,ms));signal.addEventListener('abort',done,{once:true});
});
/** DB replay and tail share one query boundary. Received positions here are not client durable ACKs. */
export async function streamDurableIngest(req:FastifyRequest,reply:FastifyReply,jobId:string,registry:IngestStreamRegistry){
 if(registry.closing)throw new AuthFault('INGEST_STREAM_UNAVAILABLE',503,true);
 const controller=new AbortController();let heartbeat:ReturnType<typeof setInterval>|undefined,deadline:ReturnType<typeof setTimeout>|undefined,heartbeatPending=false;
 let sender:ReturnType<typeof createAuthorizedSse>|undefined;
 const clearTimers=()=>{if(heartbeat)clearInterval(heartbeat);if(deadline)clearTimeout(deadline);};
 const close=()=>{controller.abort();clearTimers();if(sender)sender.close();else if(!reply.raw.destroyed&&!reply.raw.writableEnded){reply.hijack();reply.raw.destroy();}};
 const finish=()=>{controller.abort();clearTimers();sender?.finish();};
 const heartbeatWritten=()=>{if(deadline)clearTimeout(deadline);if(!controller.signal.aborted){deadline=setTimeout(close,9000);deadline.unref();}};
 reply.raw.once('close',close);reply.raw.once('finish',close);
 const task:IngestStreamTask={close,finished:Promise.resolve()};registry.tasks.add(task); // Before the first asynchronous read.
 task.finished=(async()=>{
  await getIngestSnapshot(req.user!.id,jobId);if(controller.signal.aborted||registry.closing)return;
  let cursor=selectIngestCursor(req.headers['last-event-id'],(req.query as {last_event_id?:unknown}).last_event_id);
  const initial=await readIngestReplayPage(req.user!.id,jobId,cursor);if(controller.signal.aborted||registry.closing)return;
  sender=createAuthorizedSse(req,reply,{raw:true,pollMs:1000,authorityTimeoutMs:2000,writeTimeoutMs:1000});
  if(!await sender.comment()){close();return;}heartbeatWritten();
  heartbeat=setInterval(()=>{
   if(heartbeatPending||controller.signal.aborted)return;heartbeatPending=true;
   void sender!.comment().then(ok=>{if(!ok)close();else heartbeatWritten();}).finally(()=>{heartbeatPending=false;});
  },3000);heartbeat.unref();
  let page:IngestReplayPage=initial,nextSend=performance.now();
  while(!controller.signal.aborted){
   if(page.mode==='resync'){
    if(await sender.send({event:'ingest_control',data:JSON.stringify(page.control)}))finish();else close();return;
   }
   for(const event of page.events){
    await delay(nextSend-performance.now(),controller.signal);if(controller.signal.aborted)return;
    if(!await sender.send({id:event.cursor,event:'ingest',data:JSON.stringify(event)})){close();return;}
    cursor=event.cursor;nextSend=performance.now()+20;
   }
   if(page.complete){
    const expected=page.complete;let written=false;
    const ok=await sender.send({event:'ingest_control',data:JSON.stringify(expected)},async write=>{
     const matched=await withIngestTerminalHead(req.user!.id,jobId,expected,async()=>{
      written=await write();if(written)finish();
     });
     return !matched||written; // A changed head skips this control and continues reading.
    });
    if(!ok){close();return;}if(written)return;
   }else if(cursor===page.headCursor)await delay(500,controller.signal);
   if(controller.signal.aborted)return;
   page=await readIngestReplayPage(req.user!.id,jobId,cursor);
  }
 })().catch(error=>{if(!sender&&!controller.signal.aborted)throw error;close();}).finally(()=>{registry.tasks.delete(task);clearTimers();});
 await task.finished;
}
