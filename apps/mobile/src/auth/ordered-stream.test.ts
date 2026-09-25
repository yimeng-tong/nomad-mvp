import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {watchBoundDurableStream,type OrderedStreamHandlers} from './ordered-stream';
import {commitIdentity,getAuthSnapshot} from './session-context';
const native=vi.hoisted(()=>({enabled:false,listener:undefined as undefined|((message:any)=>void),remove:vi.fn(),open:vi.fn(),start:vi.fn(),close:vi.fn()}));
vi.mock('./native',()=>({usesNativeAuth:()=>native.enabled,nativeCall:(work:()=>unknown)=>work(),nativeExpected:(scope:any)=>scope.identity,
 NomadNativeAuth:{addListener:async(_name:string,listener:(value:any)=>void)=>{native.listener=listener;return {remove:native.remove};},openStream:(...args:any[])=>native.open(...args),startStream:(...args:any[])=>native.start(...args),closeStream:(...args:any[])=>native.close(...args)}}));
class Source {
 static instances:Source[]=[];listeners=new Map<string,(event:MessageEvent)=>void>();onerror?:()=>void;close=vi.fn();
 constructor(readonly url:string){Source.instances.push(this);}
 addEventListener(name:string,listener:(event:MessageEvent)=>void){this.listeners.set(name,listener);}
 emit(name:string,value:unknown,id='received-id'){this.listeners.get(name)?.(new MessageEvent(name,{data:JSON.stringify(value),lastEventId:id}));}
}
const stops:Array<()=>void>=[];
const handlers=():OrderedStreamHandlers=>({cursor:()=>undefined,onEvent:vi.fn(async()=>{}),onControl:vi.fn(async()=>false),onError:vi.fn()});
const start=(h:OrderedStreamHandlers)=>{const stop=watchBoundDurableStream(getAuthSnapshot(),'https://api.example.test','/ingest/owned/events',h);stops.push(stop);return Source.instances.at(-1)!;};
beforeEach(()=>{commitIdentity({ownerId:'owner-a',sessionId:'session-a',nativeGeneration:1});Source.instances=[];vi.stubGlobal('EventSource',Source);native.enabled=false;native.listener=undefined;native.remove.mockReset().mockResolvedValue(undefined);native.open.mockReset().mockResolvedValue({subscriptionId:'subscription-a'});native.start.mockReset().mockResolvedValue(undefined);native.close.mockReset().mockResolvedValue(undefined);});
afterEach(()=>{for(const stop of stops.splice(0))stop();vi.useRealTimers();vi.unstubAllGlobals();});
it('awaits durable events and ordered complete before treating transport EOF as a failure',async()=>{
 const h=handlers(),seen:string[]=[];let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});
 h.onEvent=vi.fn(async(value)=>{if((value as any).seq===1)await gate;seen.push(String((value as any).seq));});
 h.onControl=vi.fn(async(_value,context)=>{expect(context.id).toBeUndefined();seen.push('complete');return true;});
 const source=start(h);source.emit('ingest',{seq:1},'id-1');source.emit('ingest',{seq:2},'id-2');source.emit('ingest_control',{kind:'complete'},'inherited-id-2');source.onerror?.();
 expect(source.close).toHaveBeenCalled();await vi.waitFor(()=>expect(h.onEvent).toHaveBeenCalledTimes(1));expect(h.onControl).not.toHaveBeenCalled();release();
 await vi.waitFor(()=>expect(seen).toEqual(['1','2','complete']));expect(h.onError).not.toHaveBeenCalled();expect(getAuthSnapshot().phase).toBe('authenticated');
});
it('reconnect input comes only from the supplied durable checkpoint, never a received event id',async()=>{
 let cursor='saved-0';const h=handlers();h.cursor=()=>cursor;h.onEvent=async()=>{cursor='saved-1';};const first=start(h);first.emit('ingest',{seq:1},'received-999');first.onerror?.();await vi.waitFor(()=>expect(h.onError).toHaveBeenCalledWith('transport'));
 commitIdentity({ownerId:'owner-a',sessionId:'session-a',nativeGeneration:1});const second=start(h);expect(new URL(second.url).searchParams.get('last_event_id')).toBe('saved-1');
});
it('count overflow drops queued work but lets the active save finish so slow storage can progress',async()=>{
 const h=handlers();let release!:()=>void,saved=0;const gate=new Promise<void>(r=>{release=r;});h.onEvent=vi.fn(async(_value,context)=>{await gate;expect(context.valid()).toBe(true);saved++;});
 const source=start(h);for(let i=0;i<65;i++)source.emit('ingest',{seq:i});expect(source.close).toHaveBeenCalled();expect(h.onError).not.toHaveBeenCalled();release();
 await vi.waitFor(()=>expect(h.onError).toHaveBeenCalledWith('overflow'));expect(h.onEvent).toHaveBeenCalledTimes(1);expect(saved).toBe(1);expect(getAuthSnapshot().phase).toBe('authenticated');
});
it('the byte budget bounds large frames independently of the event-count budget',async()=>{
 const h=handlers();let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});h.onEvent=vi.fn(async()=>gate);const source=start(h);
 for(let i=0;i<5;i++)source.emit('ingest',{text:'x'.repeat(60000)});expect(source.close).toHaveBeenCalled();release();await vi.waitFor(()=>expect(h.onError).toHaveBeenCalledWith('overflow'));expect(h.onEvent).toHaveBeenCalledTimes(1);
});
it('identity changes abort active persistence and discard late frames without reopening',async()=>{
 const h=handlers();let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});let applied=false;h.onEvent=vi.fn(async(_value,context)=>{await gate;if(context.valid())applied=true;});const source=start(h);source.emit('ingest',{seq:1});await vi.waitFor(()=>expect(h.onEvent).toHaveBeenCalled());
 const context=vi.mocked(h.onEvent).mock.calls[0][1];commitIdentity({ownerId:'owner-b',sessionId:'session-b'});expect(context.signal.aborted).toBe(true);release();source.emit('ingest',{seq:2});await Promise.resolve();expect(applied).toBe(false);expect(h.onError).not.toHaveBeenCalled();expect(Source.instances).toHaveLength(1);
});
it('a stuck consumer has a deadline and cannot leave the input connection open indefinitely',async()=>{
 vi.useFakeTimers();const h=handlers();h.onEvent=vi.fn(async()=>new Promise<void>(()=>{}));const source=start(h);source.emit('ingest',{seq:1});await vi.advanceTimersByTimeAsync(10001);
 expect(h.onError).toHaveBeenCalledWith('consumer');expect(source.close).toHaveBeenCalled();expect(vi.mocked(h.onEvent).mock.calls[0][1].signal.aborted).toBe(true);
});
it('native two-phase streams enforce identity and process complete before the bridge closure',async()=>{
 native.enabled=true;const h=handlers(),seen:string[]=[];h.onEvent=async()=>{seen.push('event');};h.onControl=async(_value,context)=>{expect(context.id).toBeUndefined();seen.push('complete');return true;};start(h);await vi.waitFor(()=>expect(native.start).toHaveBeenCalled());
 const base={subscriptionId:'subscription-a',ownerId:'owner-a',sessionId:'session-a',generation:1};native.listener?.({...base,ownerId:'owner-b',event:'ingest',data:'{"seq":0}'});
 native.listener?.({...base,event:'ingest',data:'{"seq":1}',id:'cursor-1'});native.listener?.({...base,event:'ingest_control',data:'{"kind":"complete"}',id:'inherited-cursor-1'});native.listener?.({...base,closed:true});
 await vi.waitFor(()=>expect(seen).toEqual(['event','complete']));expect(h.onError).not.toHaveBeenCalled();expect(native.close).toHaveBeenCalledWith({subscriptionId:'subscription-a'});
});
it('a late native open after an owner change is closed before start',async()=>{
 native.enabled=true;let opened!:(value:any)=>void;native.open.mockImplementation(()=>new Promise(r=>{opened=r;}));start(handlers());await vi.waitFor(()=>expect(native.open).toHaveBeenCalled());
 commitIdentity({ownerId:'owner-b',sessionId:'session-b'});opened({subscriptionId:'old-subscription'});await vi.waitFor(()=>expect(native.close).toHaveBeenCalledWith({subscriptionId:'old-subscription'}));expect(native.start).not.toHaveBeenCalled();
});
it('fair rotation closes idle input and waits for an active save before yielding',async()=>{
 vi.useFakeTimers();const h=handlers();let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});let saved=false;
 h.shouldYield=()=>true;h.onYield=vi.fn(()=>{expect(saved).toBe(true);});h.onEvent=vi.fn(async(_value,context)=>{await gate;expect(context.valid()).toBe(true);saved=true;});
 const source=start(h);source.emit('ingest',{seq:1});source.emit('ingest',{seq:2});await vi.advanceTimersByTimeAsync(2001);
 expect(source.close).toHaveBeenCalled();expect(h.onYield).not.toHaveBeenCalled();release();await vi.advanceTimersByTimeAsync(1);
 expect(h.onYield).toHaveBeenCalledTimes(1);expect(h.onEvent).toHaveBeenCalledTimes(1);expect(h.onError).not.toHaveBeenCalled();
 const idle=handlers();idle.shouldYield=()=>true;idle.onYield=vi.fn();start(idle);await vi.advanceTimersByTimeAsync(2001);expect(idle.onYield).toHaveBeenCalledTimes(1);
});
