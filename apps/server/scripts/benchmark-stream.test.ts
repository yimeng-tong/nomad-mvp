import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {openBenchmarkStream} from './benchmark-stream.js';
const complete='event: ingest_control\ndata: {"kind":"complete"}\n\n';
async function fixture(body:string|null,work:(url:string)=>Promise<void>){
 const server=createServer((_req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/event-stream');if(body===null)res.write(complete);else res.end(body);});
 server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');
 try{await work(`http://127.0.0.1:${address.port}/events`);}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
test('complete followed by malformed JSON is a failed stream, not a passing terminal sample',async()=>{
 await fixture('event: ingest\ndata: {"seq":"1"}\n\n'+complete+'event: ingest\ndata: invalid-json\n\n',async url=>{const stream=await openBenchmarkStream(url,{});await stream.done;assert.equal(stream.ended(),true);assert.equal(stream.events().length,1);assert.ok(stream.error());assert.equal(stream.naturalEnd(),false);});
});
test('oversized buffered data settles without an unhandled rejection',async()=>{
 await fixture('x'.repeat(256*1024),async url=>{const stream=await openBenchmarkStream(url,{});await stream.done;assert.ok(stream.error());assert.equal(stream.naturalEnd(),false);});
});
test('complete on a connection that never ends fails at its transport deadline',async()=>{
 await fixture(null,async url=>{const stream=await openBenchmarkStream(url,{},100);await stream.done;assert.equal(stream.frames.length,1);assert.ok(stream.error());assert.equal(stream.naturalEnd(),false);});
});
test('only an intact stream with natural EOF is successful',async()=>{
 await fixture(complete,async url=>{const stream=await openBenchmarkStream(url,{});await stream.done;assert.equal(stream.error(),undefined);assert.equal(stream.naturalEnd(),true);assert.equal(stream.frames.at(-1)?.event,'ingest_control');});
});
