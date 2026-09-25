import {getAuthSnapshot,markChecking,subscribeAuth,type AuthSnapshot} from './session-context';
import {nativeCall,nativeExpected,NomadNativeAuth,usesNativeAuth} from './native';
import type {NativeListener} from '@nomad/native-auth';
export type OrderedStreamContext={signal:AbortSignal;valid:()=>boolean;id?:string};
export type OrderedStreamFailure='transport'|'overflow'|'consumer';
export type OrderedStreamHandlers={
 cursor:()=>string|undefined;
 shouldYield?:()=>boolean;
 onYield?:()=>void;
 onEvent:(value:unknown,context:OrderedStreamContext)=>Promise<void>;
 onControl:(value:unknown,context:OrderedStreamContext)=>Promise<boolean>;
 onError:(reason:OrderedStreamFailure)=>void;
};
type Frame={kind:'event'|'control';data:string;id?:string;size:number};
/** Explicitly ordered durable consumer; legacy synchronous planner streams keep their existing transport. */
export function watchBoundDurableStream(scope:AuthSnapshot,baseUrl:string,path:string,handlers:OrderedStreamHandlers):()=>void {
 const controller=new AbortController();let disposed=false,inputClosed=false,draining=false,pending=0,bytes=0;
 let yielding=false,yieldTimer:ReturnType<typeof setInterval>|undefined;
 let ended:OrderedStreamFailure|undefined,source:EventSource|undefined,nativeId:string|undefined,listener:NativeListener|undefined,unsubscribe=()=>{};
 const queue:Frame[]=[];
 const valid=()=>{const now=getAuthSnapshot();return !disposed&&!controller.signal.aborted&&now.phase==='authenticated'&&now.epoch===scope.epoch&&now.activity===scope.activity;};
 const closeInput=()=>{
  inputClosed=true;source?.close();source=undefined;
  const id=nativeId;nativeId=undefined;if(id)void NomadNativeAuth.closeStream({subscriptionId:id}).catch(()=>{});
  const registered=listener;listener=undefined;void registered?.remove().catch(()=>{});
 };
 const discardQueued=()=>{for(const frame of queue){pending--;bytes-=frame.size;}queue.length=0;};
 const stop=()=>{if(disposed)return;disposed=true;clearInterval(yieldTimer);closeInput();discardQueued();controller.abort();unsubscribe();};
 const failed=(reason:OrderedStreamFailure)=>{
  if(disposed)return;stop();try{handlers.onError(reason);}catch{/* A consumer callback cannot reopen a disposed stream. */}
  const now=getAuthSnapshot();if(reason==='transport'&&now.epoch===scope.epoch&&now.activity===scope.activity&&now.phase==='authenticated')markChecking();
 };
 const consume=async(frame:Frame):Promise<boolean>=>{
  const context:OrderedStreamContext={signal:controller.signal,valid,...(frame.kind==='event'?{id:frame.id}:{})};
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   return await new Promise<boolean>((resolve,reject)=>{
    const aborted=()=>reject(new Error('STREAM_CONTEXT_CHANGED'));
    controller.signal.addEventListener('abort',aborted,{once:true});
    timer=setTimeout(()=>failed('consumer'),10000);
    Promise.resolve().then(async()=>{if(!valid())throw new Error('STREAM_CONTEXT_CHANGED');const value=JSON.parse(frame.data);
     if(frame.kind==='event'){await handlers.onEvent(value,context);return false;}return await handlers.onControl(value,context);
    }).then(resolve,reject).finally(()=>controller.signal.removeEventListener('abort',aborted));
   });
  }finally{if(timer)clearTimeout(timer);}
 };
 const drain=async()=>{
  if(draining||disposed)return;draining=true;
  try{
   while(queue.length&&valid()){
    const frame=queue.shift()!;let terminal=false;
    try{terminal=await consume(frame);}finally{pending--;bytes-=frame.size;}
    if(!valid())return;if(terminal){stop();return;}
   }
   if(!valid()){stop();return;}if(ended)failed(ended);else if(yielding){stop();handlers.onYield?.();}
  }catch{if(!disposed)failed('consumer');}
  finally{draining=false;}
 };
 const end=()=>{if(inputClosed||disposed)return;ended='transport';closeInput();void drain();};
 const receive=(kind:Frame['kind'],data:string,id?:string)=>{
  if(inputClosed||!valid())return;
  const size=typeof data==='string'&&data.length<=65536?new TextEncoder().encode(data).byteLength:Infinity;
  if(size>65536||pending>=64||bytes+size>256*1024){
   ended='overflow';closeInput();discardQueued();
   // Let the one already-running save settle. Aborting it on every overflow could prevent any progress on slow storage.
   void drain();return;
  }
  queue.push({kind,data,id,size});pending++;bytes+=size;void drain();
 };
 if(handlers.shouldYield&&handlers.onYield)yieldTimer=setInterval(()=>{
  if(!inputClosed&&valid()&&handlers.shouldYield?.()){yielding=true;closeInput();discardQueued();void drain();}
 },2000);
 unsubscribe=subscribeAuth(()=>{if(!valid())stop();});
 if(!valid()||!path.startsWith('/')||path.startsWith('//')||path.includes('#')){failed('consumer');return stop;}
 if(usesNativeAuth()){
  void(async()=>{
   const registered=await nativeCall(()=>NomadNativeAuth.addListener('nativeAuthStream',message=>{
    if(!valid()||message.subscriptionId!==nativeId||message.ownerId!==scope.identity?.ownerId||message.sessionId!==scope.identity?.sessionId||message.generation!==scope.identity?.nativeGeneration)return;
    if(message.closed){end();return;}
    if(message.data&&message.event==='ingest')receive('event',message.data,message.id);
    else if(message.data&&message.event==='ingest_control')receive('control',message.data);
   }));
   if(!valid()||inputClosed){await registered.remove();return;}listener=registered;
   const opened=await nativeCall(()=>NomadNativeAuth.openStream({path,lastEventId:handlers.cursor(),expected:nativeExpected(scope)}));
   if(!valid()||inputClosed){await NomadNativeAuth.closeStream(opened);return;}nativeId=opened.subscriptionId;
   await nativeCall(()=>NomadNativeAuth.startStream(opened));
  })().catch(()=>end());
 }else{
  try{
   const url=new URL(`${baseUrl}${path}`,window.location.origin);url.searchParams.set('auth_user_id',scope.identity?.ownerId??'anonymous');url.searchParams.set('auth_session_id',scope.identity?.sessionId??'anonymous');
   const cursor=handlers.cursor();if(cursor)url.searchParams.set('last_event_id',cursor);
   source=new EventSource(url.toString(),{withCredentials:true});
   source.addEventListener('ingest',event=>receive('event',(event as MessageEvent<string>).data,(event as MessageEvent<string>).lastEventId));
   source.addEventListener('ingest_control',event=>receive('control',(event as MessageEvent<string>).data));
   source.onerror=end;
  }catch{end();}
 }
 return stop;
}
