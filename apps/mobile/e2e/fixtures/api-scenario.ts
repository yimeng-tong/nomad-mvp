import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { BrowserContext, Route, Request } from 'playwright/test';
import type { components } from 'nomad-types/src/api-types';
import { authConfig, currentUser, otpSent } from '../../workbench/fixtures';
import { parseIngestEvent, parseIngestRecovery, parseIngestSnapshot } from '../../src/home/ingest-protocol';
import { rejectWebSockets } from './sockets';

export type Owner = 'A' | 'B';
type Schema = components['schemas'];
type Snapshot = Schema['IngestSnapshot'];
type Job = { owner: Owner; id: string; stream: string; snapshot: Snapshot; events: Schema['IngestDurableEvent'][] };
type RequestRecord = { method: string; path: string; owner: Owner | null; operationId?: string };
const origin = 'http://127.0.0.1:4175';
const timestamp = '2026-09-25T00:00:00.000Z';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const syntheticUser = (owner: Owner): Schema['CurrentUserResponse'] => owner === 'A' ? structuredClone(currentUser) : {
  user_id: '00000000-0000-4000-8000-000000000096', user: { id: '00000000-0000-4000-8000-000000000096' },
  session: { ...currentUser.session, id: '00000000-0000-4000-8000-000000000097' },
};
const user = syntheticUser;
const object = (value: unknown): Record<string, unknown> => {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'Synthetic request must be an object');
  return value as Record<string, unknown>;
};
const string = (value: unknown): string => { assert.equal(typeof value, 'string'); return value as string; };
const fault = (code: string, message = '合成请求暂不可用'): Schema['ErrorEnvelope'] => ({ error_code: code, error_message: message, retriable: true });

/** Test-only HTTP state. It never replaces the product auth/controller/journal. */
export class ApiScenario {
  readonly marker = 'NOMAD_E2E_FIXTURE';
  identity: Owner | null = null;
  sessionRevision = 0;
  authorityUnavailable = false;
  library: 'normal' | 'empty' | 'error' | 'long' = 'normal';
  pendingInspirationCount = 1;
  otpError = false;
  dropNextAck = false;
  blockReceipts = false;
  disconnectNextStream = false;
  nextImport: 'running' | 'partial' | 'done' = 'running';
  readonly records: RequestRecord[] = [];
  readonly violations: string[] = [];
  readonly pageErrors: string[] = [];
  readonly jobs = new Map<string, Job>();
  private readonly commands = new Map<string, { owner: Owner; jobId: string; kind: 'start' | 'retry'; payload: string; disposition: Schema['IngestAcceptedResponse']['disposition'] }>();
  private readonly held = new Set<string>();
  private readonly releases = new Map<string, Set<() => void>>();
  private readonly pending = new Set<Promise<void>>();
  private readonly pendingPaths = new Map<Promise<void>, string>();
  private readonly streams = new Map<string, Set<() => void>>();
  private readonly intentionalAborts = new Set<Request>();
  private closing = false;
  private otpPhone: string | null = null;
  private context?: BrowserContext;
  private readonly outputs = (JSON.parse(readFileSync(new URL('../../.workbench-results/product-graph.json', import.meta.url), 'utf8')) as { outputs: Record<string, string> }).outputs;

  hold(path: string) { this.held.add(path); }
  release(path: string) {
    this.held.delete(path);
    for (const release of this.releases.get(path) ?? []) release();
    this.releases.delete(path);
  }
  releaseNewest(path: string) {
    const set = this.releases.get(path), newest = set ? [...set].at(-1) : undefined;
    assert.ok(newest, 'A held response is required'); set!.delete(newest); newest();
  }
  async releaseAndWait(path: string) {
    this.release(path);
    await Promise.all([...this.pendingPaths].filter(([, requestPath]) => requestPath === path).map(([work]) => work));
  }
  private user(owner: Owner) {
    const value = user(owner);
    if (this.sessionRevision) value.session.id = value.session.id.slice(0, -8) + (parseInt(value.session.id.slice(-8), 16) + this.sessionRevision).toString(16).padStart(8, '0');
    return value;
  }
  private gate(path: string): Promise<void> {
    if (!this.held.has(path) || this.closing) return Promise.resolve();
    return new Promise((resolve) => {
      const set = this.releases.get(path) ?? new Set(); set.add(resolve); this.releases.set(path, set);
    });
  }
  count(method: string, path: string) { return this.records.filter((record) => record.method === method && record.path === path).length; }
  retire() { this.closing = true; }
  private async abort(route: Route) {
    this.intentionalAborts.add(route.request());
    try { await route.abort('failed'); } catch { /* The browser may already have cancelled the declared request. */ }
  }
  private async json(route: Route, body: unknown, status = 200) {
    const bytes = JSON.stringify(body); // Capture the original owner response before a controlled delay.
    await this.gate(new URL(route.request().url()).pathname);
    if (this.closing) { await this.abort(route); return; }
    await route.fulfill({ status, contentType: 'application/json', headers: { 'Cache-Control': 'no-store' }, body: bytes });
  }
  async install(context: BrowserContext) {
    this.context = context;
    await rejectWebSockets(context, () => this.violations.push(this.closing ? 'NOMAD_E2E_LATE_REQUEST' : 'NOMAD_E2E_WEBSOCKET_FORBIDDEN'));
    context.on('page', (page) => page.on('pageerror', (error) => this.pageErrors.push(error.name)));
    await context.route('**/*', async (route) => {
      const work = this.handle(route).catch(async () => {
        const failure = route.request().failure()?.errorText ?? '';
        if (!this.closing && !this.intentionalAborts.has(route.request()) && !/abort|cancel/i.test(failure)) this.violations.push('NOMAD_E2E_HANDLER_FAILURE');
        await this.abort(route);
      });
      this.pending.add(work);
      this.pendingPaths.set(work, new URL(route.request().url()).pathname);
      try { await work; } finally { this.pending.delete(work); this.pendingPaths.delete(work); }
    });
  }
  async finish() {
    this.closing = true;
    for (const path of this.held) this.release(path);
    for (const waiting of this.streams.values()) for (const release of waiting) release();
    await Promise.all(this.context?.pages().map((page) => page.close()) ?? []);
    await Promise.all([...this.pending]);
    assert.deepEqual(this.violations, [], 'NOMAD_E2E_NETWORK_VIOLATIONS');
    assert.deepEqual(this.pageErrors, [], 'NOMAD_E2E_PAGE_ERRORS');
  }

  private item(owner: Owner, id = `fixture-${owner}`): Schema['LibraryInspirationItem'] {
    return { id, title: `${owner}的合成灵感`, summary: `${owner}的合成私有内容`, locate_status: 'pending', city_id: null,
      city_name: null, poi_id: null, poi_name: null, poi_address: null, asset_count: 1, candidate_count: 1, created_at: timestamp };
  }
  private append(job: Job, patch: Partial<Snapshot>) {
    const seq = job.events.length + 1;
    const cursor = `i1:${job.stream}:${seq}`;
    job.snapshot = { ...job.snapshot, ...patch, head_cursor: cursor, state_version: seq - 1 };
    const snapshot = parseIngestSnapshot(job.snapshot, job.id, cursor);
    const event = { schema_version: 1, kind: 'fact', seq: String(seq), cursor, ingest_id: job.id, trace_id: job.stream,
      state: snapshot.state, stage: snapshot.state, attempt: snapshot.attempt, retry: snapshot.attempt - 1,
      state_version: snapshot.state_version, occurred_at: timestamp, ts: Date.parse(timestamp), snapshot } satisfies Schema['IngestDurableEvent'];
    parseIngestEvent(event, job.id);
    job.events.push(event);
    for (const release of this.streams.get(job.id) ?? []) release();
    this.streams.delete(job.id);
  }
  complete(jobId: string, partial = false) {
    const job = this.jobs.get(jobId); assert.ok(job, 'Declared synthetic job required');
    this.append(job, { state: partial ? 'failed' : 'done', partial, retriable: partial, stored_count: 1,
      error_code: partial ? 'INGEST_REHOST_DEGRADED' : null,
      result: { inspiration_id: `result-${job.id}`, locate_status: 'pending', asset_count: 1, city_name: null },
      actions: { retry: partial, view: true } });
  }
  private createJob(owner: Owner): Job {
    const id = `ing_${randomUUID()}`;
    const job: Job = { owner, id, stream: randomUUID(), events: [], snapshot: {
      ingest_id: id, attempt: 1, state_version: 0, state: 'created', source_title: `${owner}的合成导入`, sub_stage: null,
      partial: false, retriable: false, error_code: null, updated_at: timestamp, result: null,
      fetched_count: null, parsed_count: null, candidate_count: null, stored_count: null, actions: { retry: false, view: false },
    } };
    this.jobs.set(id, job); this.append(job, {}); this.append(job, { state: 'fetching' });
    if (this.nextImport !== 'running') this.complete(id, this.nextImport === 'partial');
    return job;
  }
  private receipt(operation: string): Schema['IngestAcceptedResponse'] {
    const command = this.commands.get(operation); assert.ok(command);
    const job = this.jobs.get(command.jobId); assert.ok(job);
    return { operation_id: operation, ingest_id: job.id, state: job.snapshot.state, disposition: command.disposition,
      snapshot: structuredClone(job.snapshot), sse_url: `/ingest/${job.id}/events` };
  }
  private async stream(route: Route, job: Job, url: URL) {
    if (this.disconnectNextStream) { this.disconnectNextStream = false; await this.abort(route); return; }
    const after = url.searchParams.get('last_event_id') ?? '';
    const seq = after ? Number(after.split(':').at(-1)) : 0;
    if (!['done', 'failed'].includes(job.snapshot.state) && job.events.length <= seq) {
      await new Promise<void>((resolve) => {
        const set = this.streams.get(job.id) ?? new Set(); set.add(resolve); this.streams.set(job.id, set);
      });
    }
    if (this.closing) { await this.abort(route); return; }
    const frames = job.events.filter((event) => Number(event.seq) > seq).map((event) => `id: ${event.cursor}\nevent: ingest\ndata: ${JSON.stringify(event)}\n\n`);
    const control = { kind: 'complete', ingest_id: job.id, cursor: job.snapshot.head_cursor!, attempt: job.snapshot.attempt,
      state_version: job.snapshot.state_version } satisfies Schema['IngestControl'];
    frames.push(`event: ingest_control\ndata: ${JSON.stringify(control)}\n\n`);
    await route.fulfill({ status: 200, contentType: 'text/event-stream', headers: { 'Cache-Control': 'no-store' }, body: frames.join('') });
  }

  private async handle(route: Route) {
    const req = route.request(), url = new URL(req.url()), path = url.pathname, method = req.method();
    if (this.closing) { this.violations.push('NOMAD_E2E_LATE_REQUEST'); await this.abort(route); return; }
    if (url.origin !== origin) { this.violations.push('NOMAD_E2E_EXTERNAL_REQUEST'); await this.abort(route); return; }
    if (!path.startsWith('/api/')) {
      const kind = req.resourceType();
      if (method === 'GET' && kind === 'document' && ['/__nomad_e2e/legal/privacy', '/__nomad_e2e/legal/terms'].includes(path)) {
        await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', headers: { 'Content-Security-Policy': "default-src 'none'", 'Cache-Control': 'no-store' },
          body: '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>合成公开说明</title><main><h1>合成公开说明</h1><p>仅用于浏览器测试，不是正式协议。</p></main></html>' }); return;
      }
      if (method === 'GET' && !['fetch', 'xhr', 'eventsource'].includes(kind)
        && (['/', '/ops', '/favicon.ico'].includes(path) || Object.hasOwn(this.outputs, path.slice(1)))) { await route.continue(); return; }
      this.violations.push('NOMAD_E2E_UNDECLARED_REQUEST'); await this.abort(route); return;
    }
    const body = method === 'POST' ? object(req.postDataJSON() as unknown) : {};
    const owner = this.identity;
    this.records.push({ method, path, owner, ...(typeof body.operation_id === 'string' ? { operationId: body.operation_id } : {}) });
    if (method === 'GET' && path === '/api/auth/config') {
      await this.json(route, { ...authConfig, privacy_url: `${origin}/__nomad_e2e/legal/privacy`, user_agreement_url: `${origin}/__nomad_e2e/legal/terms` }); return;
    }
    if (method === 'GET' && path === '/api/me') {
      await this.json(route, this.authorityUnavailable ? fault('AUTH_AUTHORITY_UNAVAILABLE') : owner ? this.user(owner) : fault('AUTH_SESSION_EXPIRED'), this.authorityUnavailable ? 503 : owner ? 200 : 401); return;
    }
    if (method === 'POST' && path === '/api/auth/otp/start') {
      if (typeof body.phone !== 'string' || !/^1\d{10}$/.test(body.phone)) { await this.json(route, fault('AUTH_PHONE_INVALID', '合成错误：请输入有效手机号'), 400); return; }
      if (!this.otpError) this.otpPhone = string(body.phone);
      await this.json(route, this.otpError ? fault('AUTH_SEND_REJECTED', '合成错误：验证码暂未发送') : otpSent, this.otpError ? 403 : 200); return;
    }
    if (method === 'POST' && path === '/api/auth/otp/verify') {
      if (typeof body.phone !== 'string' || !/^1\d{10}$/.test(body.phone) || body.phone !== this.otpPhone || body.otp !== '123456') {
        await this.json(route, fault('AUTH_OTP_INVALID', '合成错误：验证码或手机号无效'), 400); return;
      }
      this.otpPhone = null;
      this.identity = body.phone === '13900139000' ? 'B' : 'A';
      await this.json(route, this.user(this.identity)); return;
    }
    const command = /^\/api\/ingest\/commands\/([^/]+)$/.exec(path);
    const match = /^\/api\/ingest\/([^/]+)(?:\/(recovery|events|result|retry))?$/.exec(path);
    const job = match ? this.jobs.get(match[1]) : undefined;
    const declared = method === 'GET' && ['/api/library/cities', '/api/library/inspirations', '/api/user-key',
      '/api/library/inspirations/fixture-A/candidates', '/api/library/inspirations/fixture-B/candidates'].includes(path)
      || method === 'POST' && ['/api/logout', '/api/home/input/parse', '/api/ingest/xhs'].includes(path)
      || method === 'GET' && !!command && this.commands.has(command[1])
      || !!job && !!match && (method === 'GET' && match[2] !== 'retry' || method === 'POST' && match[2] === 'retry');
    if (!declared) { this.violations.push('NOMAD_E2E_UNDECLARED_REQUEST'); await this.abort(route); return; }
    if (!owner) { await this.json(route, fault('AUTH_SESSION_EXPIRED'), 401); return; }
    const expected = this.user(owner), headers = req.headers();
    const suppliedOwner = headers['x-auth-user-id'] ?? url.searchParams.get('auth_user_id');
    const suppliedSession = headers['x-auth-session-id'] ?? url.searchParams.get('auth_session_id');
    if (suppliedOwner !== expected.user_id || suppliedSession !== expected.session.id) { await this.json(route, fault('AUTH_CONTEXT_CHANGED'), 409); return; }
    if (method === 'POST' && path === '/api/logout') {
      assert.match(string(body.operation_id), uuid); this.identity = null; await this.json(route, { ok: true }); return;
    }
    if (method === 'GET' && path === '/api/library/cities') {
      if (this.library === 'error') { await this.json(route, fault('LIBRARY_UNAVAILABLE', '合成错误：灵感暂未更新'), 503); return; }
      const cities: Schema['LibraryCitiesResponse'] = this.library === 'empty' ? { cities: [], unlocated_count: 0 }
        : { cities: [{ city_id: `city-${owner}`, name: this.library === 'long' ? `${owner}的长中文城市名称`.repeat(12) : `${owner}的合成城市`, inspiration_count: 1, pending_count: 0 }], unlocated_count: this.pendingInspirationCount };
      await this.json(route, cities); return;
    }
    if (method === 'GET' && path === '/api/library/inspirations') {
      const pending = Array.from({ length: this.pendingInspirationCount }, (_, index) => ({ ...this.item(owner, index ? `fixture-${owner}-${index}` : `fixture-${owner}`),
        title: index ? `${owner}的合成灵感 ${index + 1}` : `${owner}的合成灵感`, candidate_count: index ? 0 : 1 }));
      const located: Schema['LibraryInspirationItem'] = { ...this.item(owner, `located-${owner}`), title: `${owner}的合成已定位灵感`, locate_status: 'resolved',
        city_id: `city-${owner}`, city_name: `${owner}的合成城市`, poi_id: `poi-${owner}`, poi_name: '合成地点', poi_address: '合成地址', candidate_count: 0 };
      const filtered = url.searchParams.get('locate_status') === 'pending' ? pending : url.searchParams.has('city_id')
        ? url.searchParams.get('city_id') === `city-${owner}` ? [located] : [] : [located, ...pending];
      const items: Schema['LibraryInspirationsResponse'] = { items: this.library === 'empty' ? [] : filtered };
      await this.json(route, items); return;
    }
    if (method === 'GET' && path === `/api/library/inspirations/fixture-${owner}/candidates`) {
      await this.json(route, { candidates: [{ candidate_id: `candidate-${owner}`, name: `${owner}的合成候选`, address: '合成地址，仅用于界面测试' }] } satisfies Schema['LibraryCandidatesResponse']); return;
    }
    if (method === 'GET' && path === '/api/user-key') { await this.json(route, { configured: false, provider: null, key_ref: null }); return; }
    if (method === 'POST' && path === '/api/home/input/parse') {
      const text = string(body.text), links = [...text.matchAll(/https:\/\/xhslink\.com\/[a-z]+/g)].map((match) => ({ url: match[0], position: match.index }));
      await this.json(route, { type: links.length ? 'xhs_link' : 'unknown', original_text: text, links, link_occurrences: links, unrecognized: [] } satisfies Schema['HomeInputParseResponse']); return;
    }
    if (method === 'POST' && path === '/api/ingest/xhs') {
      const operation = string(body.operation_id); assert.match(operation, uuid);
      const source = string(body.url ?? body.share_text);
      if (!/^https:\/\/(?:xhslink\.com|www\.xiaohongshu\.com)\//.test(source)) {
        await this.json(route, fault('INGEST_XHS_URL_REQUIRED', '合成错误：需要有效链接'), 400); return;
      }
      const previous = this.commands.get(operation);
      if (previous && (previous.owner !== owner || previous.kind !== 'start' || previous.payload !== source)) {
        await this.json(route, fault('INGEST_OPERATION_CONFLICT'), 409); return;
      }
      if (!previous) { const job = this.createJob(owner); this.commands.set(operation, { owner, jobId: job.id, kind: 'start', payload: source, disposition: 'created' }); }
      if (this.dropNextAck) { this.dropNextAck = false; await this.abort(route); return; }
      await this.json(route, this.receipt(operation), 202); return;
    }
    if (method === 'GET' && command && this.commands.get(command[1])?.owner === owner) {
      await this.json(route, this.blockReceipts ? fault('INGEST_STATE_UNAVAILABLE') : this.receipt(command[1]), this.blockReceipts ? 503 : 200); return;
    }
    if (match && job?.owner === owner) {
      if (method === 'GET' && match[2] === 'events') { await this.stream(route, job, url); return; }
      if (method === 'GET' && match[2] === 'result') {
        await this.json(route, job.snapshot.result ? this.item(owner, job.snapshot.result.inspiration_id) : fault('INGEST_RESULT_UNAVAILABLE'), job.snapshot.result ? 200 : 404); return;
      }
      if (method === 'GET' && match[2] === 'recovery') {
        const cursor = url.searchParams.get('last_event_id'), head = job.snapshot.head_cursor!;
        const recovery: Schema['IngestRecoveryResponse'] = url.searchParams.get('mode') === 'resync' || !cursor
          ? { mode: 'resync', reason: 'checkpoint_missing', ingest_id: job.id, cursor: head, head_cursor: head, head_seq: String(job.events.length), replay_floor: '1', snapshot: job.snapshot }
          : { mode: 'replay', ingest_id: job.id, cursor, head_cursor: head, head_seq: String(job.events.length), replay_floor: '1' };
        parseIngestRecovery(recovery, job.id); await this.json(route, recovery); return;
      }
      if (method === 'POST' && match[2] === 'retry') {
        const operation = string(body.operation_id); assert.match(operation, uuid);
        const payload = JSON.stringify({ jobId: job.id, attempt: body.expected_attempt, version: body.expected_state_version });
        const previous = this.commands.get(operation);
        if (previous) {
          if (previous.owner !== owner || previous.kind !== 'retry' || previous.jobId !== job.id || previous.payload !== payload) {
            await this.json(route, fault('INGEST_OPERATION_CONFLICT'), 409); return;
          }
          await this.json(route, this.receipt(operation)); return;
        }
        assert.equal(body.expected_attempt, job.snapshot.attempt); assert.equal(body.expected_state_version, job.snapshot.state_version);
        assert.equal(job.snapshot.state, 'failed'); assert.equal(job.snapshot.retriable, true);
        this.append(job, { attempt: job.snapshot.attempt + 1, state: 'created', retriable: false, error_code: null, actions: { retry: false, view: !!job.snapshot.result } });
        this.commands.set(operation, { owner, jobId: job.id, kind: 'retry', payload, disposition: 'retried' }); await this.json(route, this.receipt(operation)); return;
      }
      if (method === 'GET' && !match[2]) { await this.json(route, job.snapshot); return; }
    }
    if (command || job || /\/candidates$/.test(path)) { await this.json(route, fault('NOT_FOUND'), 404); return; }
    this.violations.push('NOMAD_E2E_UNDECLARED_REQUEST'); await this.abort(route);
  }
}
