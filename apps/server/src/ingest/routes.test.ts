import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import sse from 'fastify-sse-v2';
import authPlugin from '../plugins/auth.js';
import errors from '../plugins/error-envelope.js';
import ingestRoutes from '../routes/ingest.js';
import homeRoutes from '../routes/home.js';
import { clearIngestStateForTests } from './store.js';
test('actual routes expose receipts, ordered input, actual status and safe retry without redispatching a completed source',async()=>{
 process.env.AUTH_RUNTIME_MODE='test';process.env.AUTH_PROVIDER='fixture';process.env.AUTH_TEST_ADAPTER_ENABLED='true';delete process.env.DATABASE_URL;clearIngestStateForTests();
 const app=Fastify({logger:false});await app.register(cookie);await app.register(sse as any);await app.register(errors);await app.register(authPlugin);await app.register(ingestRoutes);await app.register(homeRoutes);
 const headers={'x-user-id':'synthetic-route-a'};
 try{
  const parsed=await app.inject({method:'POST',url:'/home/input/parse',headers,payload:{text:'https://xhslink.com/a https://www.xiaohongshu.com/explore/b 无效片段'}});
  assert.equal(parsed.statusCode,200);assert.equal(parsed.json().links.length,2);assert.equal(parsed.json().warning,undefined);
  const natural=await app.inject({method:'POST',url:'/home/input/parse',headers,payload:{text:'厦门 2026-10-01 出发 3天 紧凑'}});
  assert.equal(natural.json().trip_params.pace,undefined);assert.ok(!natural.json().planner_handoff.route.includes('pace='));
  const operation=randomUUID(),payload={url:'https://xhslink.com/a',operation_id:operation};
  const first=await app.inject({method:'POST',url:'/ingest/xhs',headers,payload});assert.equal(first.statusCode,202);assert.equal(first.json().disposition,'created');
  const id=first.json().ingest_id;
  let snapshot=first.json().snapshot;
  for(let turn=0;turn<30&&!['done','failed'].includes(snapshot.state);turn++) { await new Promise(r=>setTimeout(r,5));snapshot=(await app.inject({method:'GET',url:`/ingest/${id}`,headers})).json(); }
  assert.equal(snapshot.state,'done');assert.equal(snapshot.stored_count,1);
  const saved=await app.inject({method:'GET',url:`/ingest/${id}/result`,headers});assert.equal(saved.statusCode,200);assert.equal(saved.json().id,snapshot.result.inspiration_id);assert.equal(saved.json().canonical_url,undefined);
  const repeated=await app.inject({method:'POST',url:'/ingest/xhs',headers,payload});assert.equal(repeated.json().snapshot.state,'done');assert.equal(repeated.json().ingest_id,id);
  const recovered=await app.inject({method:'GET',url:`/ingest/commands/${operation}`,headers});assert.equal(recovered.json().ingest_id,id);
  const wrongOwner=await app.inject({method:'GET',url:`/ingest/${id}`,headers:{'x-user-id':'synthetic-route-b'}});assert.equal(wrongOwner.statusCode,404);
  const retry=await app.inject({method:'POST',url:`/ingest/${id}/retry`,headers,payload:{operation_id:randomUUID(),expected_attempt:snapshot.attempt,expected_state_version:snapshot.state_version}});
  assert.equal(retry.statusCode,409);assert.equal(retry.json().error_code,'INGEST_RETRY_NOT_ALLOWED');
  const replay=await app.inject({method:'GET',url:`/ingest/${id}/events`,headers});
  assert.equal(replay.statusCode,200);assert.ok(replay.body.includes('"state":"done"'));assert.ok(replay.body.includes('state_version'));
 }finally{await app.close();}
});
