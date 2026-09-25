import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

assert.equal(process.env.REDIS_TEST_ACK, 'isolated-synthetic-only');
const url = new URL(process.env.REDIS_URL ?? '');
assert.equal(url.protocol, 'redis:');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Use the isolated local/CI Redis only');
const probeId = randomUUID();
for (const pauseBeforeClose of [false, true]) {
const code = `
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createClient } from 'redis';
import plugin from './src/plugins/idempotency-redis.ts';
const app = Fastify({logger:false});
await app.register(plugin); await app.ready();
const body = {probe:${JSON.stringify(probeId)}};
await app.storeIdempotency('/synthetic-lifecycle',body,1000,{ok:true},${JSON.stringify(probeId)});
assert.deepEqual(await app.checkIdempotency('/synthetic-lifecycle',body,1000,${JSON.stringify(probeId)}),{ok:true});
if (${String(pauseBeforeClose)}) {
  // Dedicated synthetic Redis only: keep TCP open but withhold command replies.
  const control = createClient({url:process.env.REDIS_URL});
  await control.connect();
  await control.sendCommand(['CLIENT','PAUSE','10000','ALL']);
  await control.disconnect();
}
await app.close();
console.log('redis-lifecycle-complete');
`;
const result = await promisify(execFile)(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], {
  cwd: fileURLToPath(new URL('..', import.meta.url)), env: process.env, timeout: 5000, maxBuffer: 64 * 1024,
});
assert.equal(result.stdout.trim(), 'redis-lifecycle-complete');
}
console.log(JSON.stringify({ result: 'redis-client-lifecycle-passed', realRedis: true, temporaryKeyTtlSeconds: 1, naturalProcessExit: true, pausedCommandReplies: true }));
