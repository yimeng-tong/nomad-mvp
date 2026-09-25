import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import fastifySSE from 'fastify-sse-v2';
import { createAuthorizedSse } from '../src/auth/sse.js';
import { buildApplication } from '../src/application.js';
import { PrismaClient } from '@prisma/client';
import authPlugin from '../src/plugins/auth.js';
import authRoutes from '../src/routes/auth.js';
import errorEnvelope from '../src/plugins/error-envelope.js';
import { PrismaAuthRepository } from '../src/auth/prisma-repository.js';
import { PersistentAuthService } from '../src/auth/service.js';
import { readAuthRuntimeConfig } from '../src/auth/runtime-config.js';
import { changeOperatorGrant } from '../src/auth/operator.js';
import { newCredential } from '../src/auth/credentials.js';
import { actorContext, lockQualifiedOwner } from '../src/auth/owner.js';
import type { PhoneProofProvider } from '../src/auth/pnvs-provider.js';

assert.equal(process.env.AUTH_TEST_DATABASE_ACK, 'isolated-synthetic-only');
assert.match(new URL(process.env.DATABASE_URL!).pathname, /^\/nomad_auth_test_[a-z0-9_]+$/);
process.env.AUTH_RUNTIME_MODE = 'staging'; process.env.AUTH_PROVIDER = 'aliyun-pnvs';
const origin = 'https://nomad.example';
const probeIp = '2001:db8:' + randomUUID().replaceAll('-', '').slice(0, 24).match(/.{4}/g)!.join(':');
const config = readAuthRuntimeConfig({
  AUTH_RUNTIME_MODE: 'staging', AUTH_PROVIDER: 'aliyun-pnvs', DATABASE_URL: process.env.DATABASE_URL,
  AUTH_NATIVE_ENABLED: 'true', AUTH_TRUSTED_PROXY_CIDRS: '127.0.0.1/32',
  AUTH_PUBLIC_ORIGIN: origin, AUTH_PRIVACY_URL: `${origin}/synthetic/privacy`, AUTH_USER_AGREEMENT_URL: `${origin}/synthetic/terms`, ALIBABA_CLOUD_ACCESS_KEY_ID: 'synthetic-ak', ALIBABA_CLOUD_ACCESS_KEY_SECRET: 'sentinel-cloud-secret',
  ALIYUN_PNVS_SIGN_NAME: 'synthetic-sign', ALIYUN_PNVS_TEMPLATE_CODE: '100001', ALIYUN_PNVS_TEMPLATE_PARAM: '{"code":"##code##","min":"5"}',
  ALIYUN_PNVS_CAPTCHA_PLATFORM: 'h5', ALIYUN_PNVS_CAPTCHA_APP_ID: 'synthetic-public-app', ALIYUN_PNVS_CAPTCHA_APP_KEY: 'sentinel-graphic-secret',
});
const databases = [new PrismaClient(), new PrismaClient()];
let sends = 0; let checks = 0; let unknownSend = false;
let pausedPhone: string | undefined; let releaseCheck: (() => void) | undefined; let checkStarted: (() => void) | undefined;
const proof: PhoneProofProvider = {
  async send() { sends++; if (unknownSend) throw new Error('sentinel-cloud-secret'); },
  async verify(phone, code) { checks++; if (phone === pausedPhone) { checkStarted?.(); await new Promise<void>((resolve) => { releaseCheck = resolve; }); } return code === '123456'; },
  async verifyGraphic() {},
};
let pausedReadEntered: (() => void) | undefined; let releaseRead: (() => void) | undefined;
let activeSender: ReturnType<typeof createAuthorizedSse> | undefined;
const apps = [];
for (const db of databases) {
  const repository = new PrismaAuthRepository(db); await repository.ready();
  const service = new PersistentAuthService(config, repository, proof);
  const app = Fastify({ logger: false, trustProxy: config.trustProxy });
  await app.register(cookie); await app.register(errorEnvelope); await app.register(fastifySSE as any);
  await app.register(authPlugin, { service }); await app.register(authRoutes, { service });
  app.get('/private/read', async (req) => ({ owner: req.user!.id }));
  app.get('/private/paused-read', async (req) => {
    pausedReadEntered?.(); await new Promise<void>((resolve) => { releaseRead = resolve; }); return { owner: req.user!.id, value: 'sentinel-private-late-read' };
  });
  app.post('/private/write', async (req) => {
    assert.equal(actorContext.getStore()?.ownerId, req.user!.id, 'request actor survives Fastify async hooks');
    await db.$transaction((tx) => lockQualifiedOwner(tx, req.user!.id));
    return { owner: req.user!.id };
  });
  app.get('/sse/private/:id', async (req, reply) => {
    activeSender = createAuthorizedSse(req, reply);
    await activeSender.send({ event: 'test', data: JSON.stringify({ owner: req.user!.id }) });
  });
  await app.ready(); apps.push(app);
}
type Jar = Map<string, string>;
const cookieHeader = (jar: Jar) => [...jar].map(([key, value]) => `${key}=${value}`).join('; ');
const absorb = (jar: Jar, response: any) => {
  const values = response.headers['set-cookie'];
  for (const value of (Array.isArray(values) ? values : values ? [values] : [])) {
    const [pair] = value.split(';'); const index = pair.indexOf('=');
    const name = pair.slice(0, index); const content = pair.slice(index + 1);
    if (!content) jar.delete(name); else jar.set(name, content);
  }
};
const anonymous = { origin, 'x-forwarded-for': probeIp, 'x-auth-user-id': 'anonymous', 'x-auth-session-id': 'anonymous' };
const expected = (user: any) => ({ origin, 'x-forwarded-for': probeIp, 'x-auth-user-id': user.user_id, 'x-auth-session-id': user.session.id });
const phone = () => '+8613'+String(Date.now()).slice(-8)+String(Math.floor(Math.random()*10));
const captcha = () => ({ lot_number: randomUUID(), captcha_output: 'isolated-proof', pass_token: 'isolated-proof', gen_time: String(Math.floor(Date.now()/1000)) });
async function sent(jar: Jar, number: string, requestId = randomUUID()) {
  const first = await apps[0].inject({ method: 'POST', url: '/auth/otp/start', headers: { ...anonymous, cookie: cookieHeader(jar) }, payload: { phone: number, request_id: requestId } });
  assert.equal(first.statusCode, 200, 'new anonymous intent should request a captcha');
  assert.equal(first.json().captcha_required, true); absorb(jar, first);
  const second = await apps[1].inject({ method: 'POST', url: '/auth/otp/start', headers: { ...anonymous, cookie: cookieHeader(jar) }, payload: { phone: number, request_id: requestId, captcha: captcha() } });
  assert.equal(second.statusCode, 200, 'isolated proof should produce a send result');
  absorb(jar, second);
  return { ...second.json(), requestId, number };
}
async function verified(jar: Jar, challenge: any, appIndex = 0) {
  const response = await apps[appIndex].inject({ method: 'POST', url: '/auth/otp/verify', headers: { ...anonymous, cookie: cookieHeader(jar) },
    payload: { phone: challenge.number, challenge_id: challenge.challenge_id, otp: '123456', device_id: 'isolated-browser' } });
  assert.equal(response.statusCode, 200, 'isolated verification should create a durable session');
  const body = response.json(); absorb(jar, response);
  const secret = jar.get(`__Host-nomad-sid-${body.session.id}`);
  assert.ok(secret && secret !== body.session.id && !response.body.includes(secret));
  assert.match(String(response.headers['set-cookie']), /__Host-nomad-login=/, 'binding is renewed with session');
  assert.match(String(response.headers['set-cookie']), /HttpOnly/); assert.match(String(response.headers['set-cookie']), /Secure/);
  return body;
}
try {
  const denied = await apps[0].inject({ method: 'GET', url: '/me', headers: { 'x-user-id': randomUUID(), 'x-auth-test-adapter-enabled': 'true' } });
  assert.equal(denied.statusCode, 401);
  const configReply = await apps[0].inject({ method: 'GET', url: '/auth/config' });
  assert.equal(configReply.json().captcha.provider, 'aliyun-pnvs');
  assert.ok(!configReply.body.includes('sentinel-'));
  const forgedOrigin = await apps[0].inject({ method: 'POST', url: '/auth/otp/start', headers: { ...anonymous, origin: 'https://attacker.invalid' }, payload: { phone: phone(), request_id: randomUUID() } });
  assert.equal(forgedOrigin.statusCode, 403); assert.equal(sends, 0);

  const jarA: Jar = new Map(); const numberA = phone(); const a = await sent(jarA, numberA);
  const repeated = await apps[0].inject({ method: 'POST', url: '/auth/otp/start', headers: { ...anonymous, cookie: cookieHeader(jarA) }, payload: { phone: numberA, request_id: a.requestId } });
  assert.equal(repeated.statusCode, 200); assert.equal(sends, 1);
  const userA = await verified(jarA, a);
  const across = await apps[1].inject({ method: 'GET', url: '/me', headers: { cookie: cookieHeader(jarA) } });
  assert.equal(across.json().user_id, userA.user_id);
  const publicReference = await apps[1].inject({ method: 'GET', url: '/me', headers: { cookie: `__Host-nomad-sid-${userA.session.id}=${userA.session.id}` } });
  assert.equal(publicReference.statusCode, 401);
  const write = await apps[1].inject({ method: 'POST', url: '/private/write', headers: { ...expected(userA), cookie: cookieHeader(jarA) }, payload: {} });
  assert.equal(write.statusCode, 200);
  const missingContext = await apps[0].inject({ method: 'GET', url: '/private/read', headers: { cookie: cookieHeader(jarA) } });
  assert.equal(missingContext.statusCode, 400);

  const jarB: Jar = new Map(); const userB = await verified(jarB, await sent(jarB, phone()), 1);
  const staleWrite = await apps[0].inject({ method: 'POST', url: '/private/write', headers: { ...expected(userA), cookie: cookieHeader(jarB) }, payload: {} });
  assert.equal(staleWrite.statusCode, 409);
  const staleRead = await apps[0].inject({ method: 'GET', url: '/private/read', headers: { ...expected(userA), cookie: cookieHeader(jarB) } });
  assert.equal(staleRead.statusCode, 409);
  const operationId = randomUUID();
  const loggedOut = await apps[0].inject({ method: 'POST', url: '/logout', headers: { ...expected(userA), cookie: cookieHeader(jarA) }, payload: { operation_id: operationId } });
  assert.equal(loggedOut.statusCode, 200); absorb(jarA, loggedOut);
  // Apply A's old logout response AFTER B's successful login response, as a browser would.
  absorb(jarB, loggedOut);
  assert.equal((await apps[1].inject({ method: 'GET', url: '/me', headers: { cookie: cookieHeader(jarB) } })).json().user_id, userB.user_id,
    'late logout Set-Cookie must not erase a newer session');
  const recovered = await apps[1].inject({ method: 'POST', url: '/logout', headers: expected(userA), payload: { operation_id: operationId } });
  assert.equal(recovered.statusCode, 200, 'lost response can be confirmed after cookie clearing');
  const oldRetryWithB = await apps[1].inject({ method: 'POST', url: '/logout', headers: { ...expected(userA), cookie: cookieHeader(jarB) }, payload: { operation_id: operationId } });
  assert.equal(oldRetryWithB.statusCode, 200); assert.equal(oldRetryWithB.headers['set-cookie'], undefined);
  assert.equal((await apps[0].inject({ method: 'GET', url: '/me', headers: { cookie: cookieHeader(jarB) } })).json().user_id, userB.user_id);

  const unknownJar: Jar = new Map(); unknownSend = true;
  const uncertain = await sent(unknownJar, phone()); unknownSend = false;
  assert.equal(uncertain.delivery_state, 'unknown'); assert.equal(uncertain.sent, false);
  const sentBefore = sends;
  await apps[0].inject({ method: 'POST', url: '/auth/otp/start', headers: { ...anonymous, cookie: cookieHeader(unknownJar) }, payload: { phone: uncertain.number, request_id: uncertain.requestId } });
  assert.equal(sends, sentBefore, 'unknown-result retry does not send another SMS');

  const racingJar: Jar = new Map(); const early = await sent(racingJar, phone());
  pausedPhone = early.number;
  const entered = new Promise<void>((resolve) => { checkStarted = resolve; });
  const lateResponse = apps[0].inject({ method: 'POST', url: '/auth/otp/verify', headers: { ...anonymous, cookie: cookieHeader(racingJar) },
    payload: { phone: early.number, challenge_id: early.challenge_id, otp: '123456' } });
  // Injection begins when consumed; retain a native Promise while another instance handles a newer intent.
  const inFlight = Promise.resolve(lateResponse);
  await entered;
  const later = await sent(racingJar, phone());
  const laterUser = await verified(racingJar, later, 1);
  releaseCheck!(); const late = await inFlight;
  assert.equal(late.statusCode, 409); assert.equal(late.headers['set-cookie'], undefined);
  assert.equal((await apps[0].inject({ method: 'GET', url: '/me', headers: { cookie: cookieHeader(racingJar) } })).json().user_id, laterUser.user_id);
  const reorderedJar: Jar = new Map();
  const earlier = await sent(reorderedJar, phone());
  const committedA = await apps[0].inject({ method: 'POST', url: '/auth/otp/verify', headers: { ...anonymous, cookie: cookieHeader(reorderedJar) },
    payload: { phone: earlier.number, challenge_id: earlier.challenge_id, otp: '123456' } });
  assert.equal(committedA.statusCode, 200); // Response held in transit; browser has not received its cookies.
  const latest = await sent(reorderedJar, phone());
  const committedB = await verified(reorderedJar, latest, 1);
  absorb(reorderedJar, committedA); // A's committed success is delivered after B's success.
  const stillB = await apps[1].inject({ method: 'GET', url: '/me', headers: { cookie: cookieHeader(reorderedJar) } });
  assert.equal(stillB.json().user_id, committedB.user_id, 'late login response cannot overwrite the newer credential');

  const nativeHeaders = { 'x-forwarded-for': probeIp, 'x-forwarded-proto': 'https', 'x-nomad-auth-audience': origin,
    'x-nomad-login-binding': newCredential(), 'x-auth-user-id': 'anonymous', 'x-auth-session-id': 'anonymous' };
  const nativePhone = phone(); const nativeIntent = randomUUID();
  const nativeStart = await apps[0].inject({ method: 'POST', url: '/auth/native/otp/start', headers: nativeHeaders,
    payload: { phone: nativePhone, request_id: nativeIntent, captcha: captcha() } });
  assert.equal(nativeStart.statusCode, 200, 'native start uses the same PG authority without cookies');
  assert.equal(nativeStart.headers['set-cookie'], undefined);
  const nativeVerify = await apps[1].inject({ method: 'POST', url: '/auth/native/otp/verify', headers: nativeHeaders,
    payload: { phone: nativePhone, challenge_id: nativeStart.json().challenge_id, otp: '123456', device_id: 'native-synthetic' } });
  assert.equal(nativeVerify.statusCode, 200);
  assert.equal(nativeVerify.headers['set-cookie'], undefined);
  const nativeUser = nativeVerify.json(); const nativeSecret = nativeUser.native_session_credential;
  assert.match(nativeSecret, /^[A-Za-z0-9_-]{43}$/);
  const nativePrivate = { ...nativeHeaders, authorization: `Bearer ${nativeSecret}`,
    'x-auth-user-id': nativeUser.user_id, 'x-auth-session-id': nativeUser.session.id };
  const nativeMe = await apps[0].inject({ method: 'GET', url: '/me', headers: nativePrivate });
  assert.equal(nativeMe.statusCode, 200); assert.ok(!nativeMe.body.includes(nativeSecret));
  const nativeWrite = await apps[1].inject({ method: 'POST', url: '/private/write', headers: nativePrivate, payload: {} });
  assert.equal(nativeWrite.statusCode, 200);
  for (const extra of [{ origin }, { origin: 'null' }, { cookie: cookieHeader(jarB) }, { 'x-nomad-auth-audience': 'https://wrong.example' }, { 'x-forwarded-proto': 'http' }]) {
    assert.equal((await apps[0].inject({ method: 'GET', url: '/me', headers: { ...nativePrivate, ...extra } })).statusCode, 403);
  }
  const nativeAsCookie = await apps[0].inject({ method: 'GET', url: '/me', headers: { cookie: `__Host-nomad-sid-${nativeUser.session.id}=${nativeSecret}` } });
  assert.equal(nativeAsCookie.statusCode, 401, 'native credential cannot become a Web cookie');
  const webAsBearer = await apps[0].inject({ method: 'GET', url: '/me', headers: { ...nativePrivate, authorization: `Bearer ${jarB.get(`__Host-nomad-sid-${userB.session.id}`)}` } });
  assert.equal(webAsBearer.statusCode, 401, 'web credential cannot become a native bearer');
  const nativeLogout = await apps[1].inject({ method: 'POST', url: '/logout', headers: nativePrivate, payload: { operation_id: randomUUID() } });
  assert.equal(nativeLogout.statusCode, 200); assert.equal(nativeLogout.headers['set-cookie'], undefined);
  assert.equal((await apps[0].inject({ method: 'GET', url: '/me', headers: nativePrivate })).statusCode, 401);

  const readEntered = new Promise<void>((resolve) => { pausedReadEntered = resolve; });
  const pausedRead = Promise.resolve(apps[0].inject({ method: 'GET', url: '/private/paused-read', headers: { ...expected(committedB), cookie: cookieHeader(reorderedJar) } }));
  await readEntered;
  assert.equal((await apps[1].inject({ method: 'DELETE', url: `/sessions/${committedB.session.id}`, headers: { ...expected(committedB), cookie: cookieHeader(reorderedJar) } })).statusCode, 200);
  releaseRead!(); const deniedLateRead = await pausedRead;
  assert.equal(deniedLateRead.statusCode, 401); assert.ok(!deniedLateRead.body.includes('sentinel-private-late-read'));

  const opsHeaders = { ...expected(userB), cookie: cookieHeader(jarB) };
  assert.equal((await apps[0].inject({ method: 'GET', url: '/ops/me', headers: { ...opsHeaders, 'x-role': 'admin' } })).statusCode, 403);
  const grantInput = { ownerId: userB.user_id, capability: 'places.correct' as const, scope: 'workspace:nomad-test', expectedVersion: 0,
    enabled: true, approvedBy: 'synthetic-test', evidence: 'isolated-auth-http-probe' };
  const grant = await changeOperatorGrant(databases[0], grantInput);
  assert.equal(grant.version, 1);
  const granted = await apps[1].inject({ method: 'GET', url: '/ops/me', headers: opsHeaders });
  assert.equal(granted.statusCode, 200); assert.equal(granted.json().grants.length, 1);
  const operatorBody = { capability: grantInput.capability, scope: grantInput.scope, expected_grant_version: 1, operation_id: randomUUID() };
  assert.equal((await apps[1].inject({ method: 'POST', url: '/ops/access-check', headers: opsHeaders, payload: { ...operatorBody, scope: 'workspace:other' } })).statusCode, 403);
  assert.equal((await apps[1].inject({ method: 'POST', url: '/ops/access-check', headers: opsHeaders, payload: { ...operatorBody, role: 'admin' } })).statusCode, 400);
  const checked = await apps[0].inject({ method: 'POST', url: '/ops/access-check', headers: opsHeaders, payload: operatorBody });
  assert.equal(checked.statusCode, 200);
  const checkedAgain = await apps[1].inject({ method: 'POST', url: '/ops/access-check', headers: opsHeaders, payload: operatorBody });
  assert.equal(checkedAgain.json().receipt_id, checked.json().receipt_id);
  await changeOperatorGrant(databases[1], { ...grantInput, expectedVersion: 1, enabled: false });
  assert.equal((await apps[0].inject({ method: 'GET', url: '/ops/me', headers: opsHeaders })).statusCode, 403);
  assert.equal((await apps[1].inject({ method: 'POST', url: '/ops/access-check', headers: opsHeaders, payload: operatorBody })).statusCode, 403, 'old receipt does not bypass revoked capability');
  await changeOperatorGrant(databases[0], { ...grantInput, expectedVersion: 2 });
  assert.equal((await apps[0].inject({ method: 'POST', url: '/ops/access-check', headers: opsHeaders, payload: operatorBody })).statusCode, 409, 'old grant version cannot be reused after regrant');

  const full = await buildApplication(config, new PersistentAuthService(config, new PrismaAuthRepository(databases[0]), proof));
  await full.ready();
  try {
    assert.equal((await full.inject({ method: 'GET', url: '/health' })).statusCode, 200, 'full real application reaches persistent readiness');
    assert.equal((await full.inject({ method: 'GET', url: '/library/cities', headers: { 'x-user-id': userB.user_id } })).statusCode, 401);
    assert.equal((await full.inject({ method: 'GET', url: '/library/cities', headers: { ...expected(userB), cookie: cookieHeader(jarB) } })).statusCode, 200);
    assert.equal((await full.inject({ method: 'POST', url: '/plan/ai-fill', headers: { ...expected(userB), cookie: cookieHeader(jarB) }, payload: {} })).statusCode, 503);
    assert.equal((await full.inject({ method: 'POST', url: '/export/png', headers: { ...expected(userB), cookie: cookieHeader(jarB) }, payload: {} })).statusCode, 503);
  } finally { await full.close(); }
  const address = await apps[0].listen({ host: '127.0.0.1', port: 0 });
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const live = await fetch(`${address}/sse/private/test`, { headers: { ...expected(userB), cookie: cookieHeader(jarB) }, signal: controller.signal });
    assert.equal(live.status, 200); const reader = live.body!.getReader();
    const initial = await reader.read(); assert.ok(new TextDecoder().decode(initial.value).includes(userB.user_id));
    const revoke = await apps[1].inject({ method: 'DELETE', url: `/sessions/${userB.session.id}`, headers: { ...expected(userB), cookie: cookieHeader(jarB) } });
    assert.equal(revoke.statusCode, 200);
    assert.equal(await activeSender!.send({ event: 'test', data: 'sentinel-private-after-revocation' }), false);
    let remaining = '';
    for (;;) { const chunk = await reader.read(); if (chunk.done) break; remaining += new TextDecoder().decode(chunk.value); }
    assert.ok(!remaining.includes('sentinel-private-after-revocation'));
  } finally { clearTimeout(timer); controller.abort(); activeSender?.close(); }

  console.log(JSON.stringify({ result: 'auth-http-probe-passed', realProviderCalls: 0, simulatedSends: sends, simulatedChecks: checks,
    verified: ['real-sql-http-routes','header-bypass-denied','origin','opaque-cookie','cross-instance','actor-context','stale-read-write','logout-receipt','new-account-survives-old-logout-retry','unknown-send-no-retry','late-login-fenced','late-committed-login-cookie','late-logout-cookie','binding-renewed','native-no-cookie','native-api-owner','native-channel-audience-tls','native-web-credential-separation','native-logout','full-real-app-bootstrap','placeholder-capabilities-disabled','live-socket-sse-revoked','operator-default-deny','operator-scope-and-version','operator-revocation','operator-durable-check-receipt','read-revoked-before-response'] }));
} finally { for (const app of apps) await app.close(); for (const db of databases) await db.$disconnect(); }
