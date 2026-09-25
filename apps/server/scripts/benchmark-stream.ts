import assert from 'node:assert/strict';
export type BenchmarkFrame={id?:string;event?:string;data?:unknown;comment?:string;at:number};
/** Probe-only consumer: always settle done; report every parse/transport/EOF failure explicitly. */
export async function openBenchmarkStream(url:string,headers:Record<string,string>,timeoutMs=15000){
 const controller=new AbortController();
 const response=await fetch(url,{headers,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(timeoutMs)])});
 assert.equal(response.status,200);assert.match(response.headers.get('cache-control')??'',/no-store/);assert.ok(response.body);
 const frames:BenchmarkFrame[]=[];let ended=false,naturalEnd=false,readError:unknown;
 const decoder=new TextDecoder('utf-8',{fatal:true}),reader=response.body.getReader();let buffer='';
 const done=(async()=>{
  try{
   for(;;){
    const chunk=await reader.read();
    if(chunk.done){buffer+=decoder.decode();if(buffer.trim())throw new Error('INCOMPLETE_SSE_FRAME');naturalEnd=true;break;}
    buffer+=decoder.decode(chunk.value,{stream:true});assert.ok(buffer.length<256*1024);
    for(;;){
     const index=buffer.indexOf('\n\n');if(index<0)break;
     const block=buffer.slice(0,index);buffer=buffer.slice(index+2);const frame:BenchmarkFrame={at:performance.now()},data:string[]=[];
     for(const line of block.split('\n')){
      if(line.startsWith(':'))frame.comment=line.slice(1).trim();
      if(line.startsWith('id:'))frame.id=line.slice(3).trim();
      if(line.startsWith('event:'))frame.event=line.slice(6).trim();
      if(line.startsWith('data:'))data.push(line.slice(5).trimStart());
     }
     if(data.length)frame.data=JSON.parse(data.join('\n'));frames.push(frame);
    }
   }
  }catch(error){readError=error;}
  finally{ended=true;try{reader.releaseLock();}catch(error){readError??=error;}}
 })();
 return {frames,done,close:()=>controller.abort(),ended:()=>ended,error:()=>readError,naturalEnd:()=>naturalEnd,events:()=>frames.filter(frame=>frame.event==='ingest')};
}
