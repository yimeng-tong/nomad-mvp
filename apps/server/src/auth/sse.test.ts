import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createAuthorizedSse } from './sse.js';

function harness() {
  const raw = new PassThrough(); const messages: unknown[] = [];
  let qualified = true;
  const request = { authCredential: 'synthetic', authPrincipal: { id: 'session-a', user_id: 'owner-a' },
    server: { authAuthority: { cookieNames: { session: 'sid' }, authenticate: async () => qualified ? { id: 'session-a', user_id: 'owner-a' } : null } } } as unknown as FastifyRequest;
  const reply = { raw, sse: (message: unknown) => { messages.push(message); } } as unknown as FastifyReply;
  return { raw, messages, request, reply, revoke: () => { qualified = false; } };
}
test('active SSE refuses new private payloads after session revocation', async () => {
  const h = harness(); const sender = createAuthorizedSse(h.request, h.reply);
  assert.equal(await sender.send({ event: 'plan', data: 'allowed' }), true);
  h.revoke();
  assert.equal(await sender.send({ event: 'plan', data: 'private-after-revocation' }), false);
  assert.equal(h.messages.length, 1);
  assert.equal(h.raw.writableEnded, true);
  sender.close();
});
test('idle revoked SSE closes without waiting for the next business event', async () => {
  const h = harness(); const sender = createAuthorizedSse(h.request, h.reply, { pollMs: 5 });
  let timer: ReturnType<typeof setTimeout>;
  const ended = new Promise<void>((resolve, reject) => {
    h.raw.once('finish', resolve); timer = setTimeout(() => reject(new Error('revoked stream did not close')), 500);
  });
  try { h.revoke(); await ended; assert.equal(h.messages.length, 0); }
  finally { clearTimeout(timer!); sender.close(); }
});
test('an unavailable authority fails closed and does not leave a writable stream', async () => {
  const h = harness(); h.request.server.authAuthority!.authenticate = async () => { throw new Error('sentinel-private'); };
  const sender = createAuthorizedSse(h.request, h.reply);
  assert.equal(await sender.send({ event: 'ingest', data: 'private' }), false);
  assert.equal(h.messages.length, 0); assert.equal(h.raw.writableEnded, true);
});


function rawHarness(stalled=false){
 const h=harness(),raw=new PassThrough({highWaterMark:stalled?16:16384}),headers=new Map<string,unknown>();let hijacks=0;
 const response=raw as any;response.headersSent=false;response.setHeader=(name:string,value:unknown)=>headers.set(name,value);
 const write=raw.write.bind(raw);response.write=(frame:string)=>{response.headersSent=true;return write(frame);};
 const reply={raw:response,hijack:()=>{hijacks++;},getHeaders:()=>({'Access-Control-Allow-Origin':'https://synthetic.invalid'})} as unknown as FastifyReply;
 return {...h,raw,reply,headers,hijacks:()=>hijacks};
}
test('raw authorized sender preserves frame ids, no-id comments/controls and staged headers',async()=>{
 const h=rawHarness();let wire='';h.raw.on('data',chunk=>{wire+=chunk.toString();});
 const sender=createAuthorizedSse(h.request,h.reply,{raw:true});
 assert.equal(await sender.comment(),true);assert.equal(await sender.send({event:'ingest',id:'i1:synthetic:1',data:'{"seq":"1"}'}),true);
 assert.equal(await sender.send({event:'ingest_control',data:'{"kind":"complete"}'}),true);sender.finish();
 assert.equal(h.hijacks(),1);assert.equal(h.headers.get('Access-Control-Allow-Origin'),'https://synthetic.invalid');
 assert.equal(wire,': heartbeat\n\nid: i1:synthetic:1\nevent: ingest\ndata: {"seq":"1"}\n\nevent: ingest_control\ndata: {"kind":"complete"}\n\n');
});
test('raw stalled writes time out and close instead of growing a hidden plugin queue',async()=>{
 const h=rawHarness(true),sender=createAuthorizedSse(h.request,h.reply,{raw:true,writeTimeoutMs:30});
 const keepAlive=setTimeout(()=>{},200);
 try{assert.equal(await sender.send({event:'ingest',data:'x'.repeat(1024)}),false);assert.equal(h.raw.destroyed,true);assert.equal(await sender.send({event:'ingest',data:'late'}),false);}
 finally{clearTimeout(keepAlive);sender.close();}
});
test('raw send refuses revoked sessions and newline injection in protocol fields',async()=>{
 for(const event of [{event:'ingest',id:'cursor\n',data:'private'},{event:'ingest\n',data:'private'}]){
  const h=rawHarness(),sender=createAuthorizedSse(h.request,h.reply,{raw:true});assert.equal(await sender.send(event),false);assert.equal(h.hijacks(),0);sender.close();
 }
 const h=rawHarness(),sender=createAuthorizedSse(h.request,h.reply,{raw:true});h.revoke();assert.equal(await sender.send({event:'ingest',data:'private'}),false);assert.equal(h.hijacks(),0);sender.close();
});
