/** Loaded only by the local measurement runner, never by the application entry. */
import { createRoot } from 'react-dom/client';
import { ImportDockController, type DockPresentationObservation } from '../src/home/dock-controller';
import { HomeImportDock } from '../src/home/HomeImportDock';
import { createOperationJournal } from '../src/home/operation-journal';
import { commitIdentity } from '../src/auth/session-context';
import { AuthApiError } from '../src/auth/api';
import type { HomeApiClient, IngestAcceptedResponse, IngestSnapshot } from '../src/home/api';
import type { ImportMeasurementSample, ImportMeasurementManifest } from 'nomad-types/src/import-measurements';
import '../src/styles.css';

type Scenario = ImportMeasurementSample['scenario'];
export const fixturePlan = [
  { scenario: 'single', count: 3 }, { scenario: 'batch', count: 3 }, { scenario: 'partial', count: 1 }, { scenario: 'failure', count: 1 },
  { scenario: 'rejected', count: 1 }, { scenario: 'unknown-ack', count: 1 }, { scenario: 'reused', count: 1 },
  { scenario: 'retry', count: 1 }, { scenario: 'reconnect', count: 1 }, { scenario: 'missing-acceptance', count: 1 }, { scenario: 'missing-terminal', count: 1 },
] as const;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export async function runImportMeasurement(profile: 'fixed-single' | 'matrix' | 'deadline-cutoff' = 'matrix') {
  commitIdentity({ ownerId: 'measurement-owner', sessionId: 'measurement-session' });
  const clockId = crypto.randomUUID(), windowStartMs = performance.now(), deadlineMs = profile === 'deadline-cutoff' ? 250 : profile === 'fixed-single' ? 7000 : 25000;
  const planToRun = profile === 'fixed-single' ? [{ scenario: 'single' as const, count: 1 }] : fixturePlan;
  const samples = new Map<string, ImportMeasurementSample>(), segments = new Map<string, number>();
  const commands = new Map<string, IngestAcceptedResponse>(), jobs = new Map<string, IngestSnapshot>();
  const scenarios = new Map<string, Scenario>(), calls = new Map<string, number>(), recovered = new Set<string>(), duplicates = new Map<string, number>();
  const watchers = new Map<string, (snapshot: IngestSnapshot) => boolean>(), reconnects = new Map<string, number>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const inputs = new Map<string, { scenario: Scenario; confirmed: number }>();
  const deadlineAt = windowStartMs + deadlineMs; let collecting = true, serial = 0;
  const later = (ms: number, work: () => void) => { const timer = setTimeout(() => { timers.delete(timer); work(); }, ms); timers.add(timer); };
  const publish = (job: IngestSnapshot, phase: IngestSnapshot['state'], partial = false) => {
    const value: IngestSnapshot = { ...job, state: phase, state_version: job.state_version + 1, updated_at: new Date().toISOString(), partial,
      retriable: phase === 'failed' && scenarios.get(job.ingest_id) === 'retry', actions: { retry: phase === 'failed' && scenarios.get(job.ingest_id) === 'retry', view: phase === 'done' || partial } };
    if (phase === 'done' || partial) { value.stored_count = 1; value.result = { inspiration_id: crypto.randomUUID(), locate_status: 'pending', asset_count: 1, city_name: null }; }
    jobs.set(value.ingest_id, value);
    const watch = watchers.get(value.ingest_id);
    if (watch) {
      if (watch(value)) watchers.delete(value.ingest_id);
      else { duplicates.set(value.ingest_id, (duplicates.get(value.ingest_id) ?? 0) + 1); watch({ ...value }); }
    }
  };
  const schedule = (job: IngestSnapshot) => {
    const scenario = scenarios.get(job.ingest_id);
    if (scenario === 'reused') return;
    later(20, () => publish(jobs.get(job.ingest_id)!, 'fetching'));
    if (scenario === 'missing-terminal') return;
    later(40, () => publish(jobs.get(job.ingest_id)!, 'parsing'));
    later(60, () => publish(jobs.get(job.ingest_id)!, 'storing'));
    later(80, () => publish(jobs.get(job.ingest_id)!, scenario === 'failure' || scenario === 'partial' || scenario === 'retry' && job.attempt === 1 ? 'failed' : 'done', scenario === 'partial'));
  };
  const receipt = (operation: string, jobId: string): IngestAcceptedResponse => {
    const old = commands.get(operation)!; return { ...old, state: jobs.get(jobId)!.state, snapshot: structuredClone(jobs.get(jobId)!) };
  };
  const api: HomeApiClient = {
    getCities: async () => ({ cities: [], unlocated_count: 0 }), getInspirations: async () => ({ items: [] }), getCandidates: async () => ({ candidates: [] }),
    parseInput: async ({ text }) => {
      if (profile === 'deadline-cutoff') await delay(400);
      const links = text.split('\n').map((url) => ({ url, position: text.indexOf(url) }));
      return { type: 'xhs_link', original_text: text, links, link_occurrences: links, unrecognized: [] };
    },
    async startIngest(request) {
      if (performance.now() >= deadlineAt) throw new TypeError('fixture window closed');
      const operation = request.operation_id!; calls.set(operation, (calls.get(operation) ?? 0) + 1);
      const scenario = inputs.get(request.url ?? '')?.scenario ?? 'single';
      if (scenario === 'rejected') throw new AuthApiError('fixture capability rejection', { code: 'INGEST_CAPABILITY_UNAVAILABLE', status: 503 });
      if (commands.has(operation)) return receipt(operation, commands.get(operation)!.ingest_id);
      const id = `ing_${crypto.randomUUID()}`;
      const job: IngestSnapshot = { ingest_id: id, attempt: 1, state_version: 0, state: 'created', source_title: '合成测量内容', result: null, partial: false, retriable: false,
        updated_at: new Date().toISOString(), actions: { retry: false, view: false } };
      scenarios.set(id, scenario); jobs.set(id, job);
      if (scenario === 'reused') publish(job, 'done');
      const accepted: IngestAcceptedResponse = { operation_id: operation, ingest_id: id, state: jobs.get(id)!.state, sse_url: `/ingest/${id}/events`,
        disposition: scenario === 'reused' ? 'reused' : 'created', snapshot: structuredClone(jobs.get(id)!) };
      commands.set(operation, accepted); schedule(job);
      await delay(5);
      if (scenario === 'unknown-ack' || scenario === 'missing-acceptance') throw new TypeError('fixture lost ack');
      return accepted;
    },
    async getIngestCommand(operation) { const command = commands.get(operation); if (!command) throw new AuthApiError('fixture absent', { status: 404 }); if (scenarios.get(command.ingest_id) === 'missing-acceptance') throw new TypeError('fixture unavailable receipt'); recovered.add(operation); return receipt(operation, command.ingest_id); },
    async getIngestSnapshot(id) { return structuredClone(jobs.get(id)!); },
    async retryIngest(id, body) {
      if (performance.now() >= deadlineAt) throw new TypeError('fixture window closed');
      calls.set(body.operation_id, (calls.get(body.operation_id) ?? 0) + 1);
      const before = jobs.get(id)!;
      const job: IngestSnapshot = { ...before, attempt: before.attempt + 1, state_version: before.state_version + 1, state: 'created', actions: { retry: false, view: false } };
      jobs.set(id, job); schedule(job);
      const accepted: IngestAcceptedResponse = { operation_id: body.operation_id, ingest_id: id, state: 'created', sse_url: `/ingest/${id}/events`, disposition: 'retried', snapshot: structuredClone(job) };
      commands.set(body.operation_id, accepted); return accepted;
    },
    watchIngest(id, onSnapshot, onError) {
      watchers.set(id, onSnapshot);
      if (scenarios.get(id) === 'reconnect' && !reconnects.get(id)) { reconnects.set(id, 1); later(10, onError); }
      else queueMicrotask(() => { if (watchers.get(id) === onSnapshot && onSnapshot(structuredClone(jobs.get(id)!))) watchers.delete(id); });
      return () => { if (watchers.get(id) === onSnapshot) watchers.delete(id); };
    },
  };
  const observe = (event: DockPresentationObservation) => {
    if (!collecting || event.atMs > deadlineAt) return;
    const sample = samples.get(event.entryId); if (!sample) return;
    if (event.kind === 'visible-start') { sample.times.presented ??= event.atMs; segments.set(event.entryId, event.atMs); sample.visibleMs ??= 0; }
    else {
      const start = segments.get(event.entryId); if (start !== undefined) { sample.visibleMs = (sample.visibleMs ?? 0) + event.atMs - start; segments.delete(event.entryId); }
      if (event.kind === 'visible-complete') sample.times.presentationEnded = event.atMs;
    }
  };
  const journal = createOperationJournal(`nomad-import-measurement-${crypto.randomUUID()}`);
  const controller = new ImportDockController(api, journal, observe);
  const unsubscribe = controller.subscribe(() => {
    const now = performance.now(); if (!collecting || now > deadlineAt) return;
    for (const entry of controller.getSnapshot().entries) {
      let sample = samples.get(entry.id);
      if (!sample) {
        const current = inputs.get(entry.url ?? ''); if (!current) continue;
        sample = { logicalId: entry.id, clockId, scenario: current.scenario, outcome: 'unknown', disposition: 'unknown', acceptanceSource: 'unknown', operations: [entry.id],
          attemptsObserved: [], commandRequests: 0, reconnects: 0, duplicateFrames: 0, observedStages: [], visibleMs: null,
          times: { confirmed: current.confirmed, prepared: now, accepted: null, firstFact: null, terminal: null, presented: null, presentationEnded: null } };
        samples.set(entry.id, sample);
      }
      if (entry.acceptance === 'accepted') { sample.times.accepted ??= now; sample.acceptanceSource = recovered.has(entry.id) ? 'reconciled' : 'direct'; sample.disposition = entry.disposition ?? 'unknown'; }
      if (entry.acceptance === 'rejected') { sample.outcome = 'rejected'; sample.times.terminal ??= now; }
      const job = entry.snapshot;
      if (job) {
        if (!sample.attemptsObserved.includes(job.attempt)) sample.attemptsObserved.push(job.attempt);
        if (!sample.observedStages.includes(job.state)) sample.observedStages.push(job.state);
        if (job.state !== 'created') sample.times.firstFact ??= now;
        const terminal = job.state === 'done' || job.state === 'failed';
        const next = job.state === 'done' ? 'done' : job.state === 'failed' ? job.partial ? 'partial' : 'failed' : 'running';
        if (sample.outcome !== next || sample.times.terminal === null && terminal) sample.times.terminal = terminal ? now : null;
        sample.outcome = next;
        sample.reconnects = reconnects.get(job.ingest_id) ?? 0; sample.duplicateFrames = duplicates.get(job.ingest_id) ?? 0;
      }
    }
  });
  const root = createRoot(document.getElementById('root')!);
  controller.activate(); await controller.restore();
  root.render(<HomeImportDock controller={controller} selectedCount={0} onPlan={() => {}} onView={() => {}} />);
  try {
    const exercise = async () => {
    for (const plan of planToRun) for (let index = 0; index < (plan.scenario === 'batch' ? 1 : plan.count); index++) {
      if (!collecting || performance.now() >= deadlineAt) return;
      const urls = Array.from({ length: plan.scenario === 'batch' ? plan.count : 1 }, () => `https://xhslink.com/measurement_${++serial}`);
      for (const url of urls) inputs.set(url, { scenario: plan.scenario, confirmed: performance.now() });
      controller.setInput(urls.join('\n')); await controller.submit();
      await delay(120);
      if (!collecting || performance.now() >= deadlineAt) return;
      const entry = controller.getSnapshot().entries.find((item) => item.url === urls.at(-1)); if (!entry) continue;
      if (plan.scenario === 'unknown-ack') await controller.recover(entry.id);
      if (plan.scenario === 'retry') {
        while (controller.getSnapshot().entries.find((item) => item.id === entry.id)?.snapshot?.state !== 'failed' && performance.now() - windowStartMs < deadlineMs) await delay(50);
        if (!collecting || performance.now() >= deadlineAt) return;
        await controller.retry(entry.id); await delay(120);
      }
    }
    };
    await Promise.race([exercise(), delay(Math.max(0, deadlineAt - performance.now()))]);
    while (performance.now() < deadlineAt) await delay(Math.max(1, deadlineAt - performance.now()));
    collecting = false;
    const windowEndMs = deadlineAt;
    for (const sample of samples.values()) {
      const entry = controller.getSnapshot().entries.find((item) => item.id === sample.logicalId);
      if (entry?.jobId) { sample.operations = [...commands.entries()].filter(([, value]) => value.ingest_id === entry.jobId).map(([id]) => id); sample.duplicateFrames = duplicates.get(entry.jobId) ?? 0; sample.reconnects = reconnects.get(entry.jobId) ?? 0; }
      sample.commandRequests = sample.operations.reduce((sum, id) => sum + (calls.get(id) ?? 0), 0);
      const started = segments.get(sample.logicalId); if (started !== undefined) sample.visibleMs = (sample.visibleMs ?? 0) + windowEndMs - started;
    }
    const manifest: ImportMeasurementManifest = { measurementVersion: 'nomad.import.v1', workload: 'WL-IMPORT-DOCK', mode: 'fixture', clockId,
      scenarioPlan: [...planToRun], plannedLogicalRequests: planToRun.reduce((sum, plan) => sum + plan.count, 0), windowStartMs, windowEndMs, deadlineMs, fixtureVersion: `import-${profile}-v1`, sampling: 1 };
    return { manifest, samples: structuredClone([...samples.values()]), fixturePlan: planToRun };
  } finally { collecting = false; root.unmount(); controller.deactivate(); unsubscribe(); for (const timer of timers) clearTimeout(timer); journal.close(); }
}
