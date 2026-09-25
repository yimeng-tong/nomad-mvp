import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createAuthMeasurementReport } from '../../packages/types/src/auth-measurements.js';
import type * as Harness from '../../apps/mobile/scripts/auth-measurement-harness.js';

// Execute the actual harness body with only its imported React/App/identity dependencies
// replaced. The clock deliberately advances without running timer callbacks.
const path = 'apps/mobile/scripts/auth-measurement-harness.tsx';
const source = readFileSync(path, 'utf8');
assert.equal((source.match(/^import .*;$/gm) ?? []).length, 4, 'HARNESS_IMPORT_ANCHOR_CHANGED');
const js = ts.transpileModule(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')
  + '\nglobalThis.probe = {beginRun,beginCase,beginUiPhase,finishCase,finishRun,mount,remaining};',
{ compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, module: ts.ModuleKind.None } }).outputText;
function fixture() {
  let now = 1000.4, callback: (() => void) | undefined, requests = 0, mounts = 0;
  const context = { window: { fetch: async () => { requests++; return new Response('{}'); } }, location: { href: 'http://fixture.invalid/', origin: 'http://fixture.invalid' },
    performance: { now: () => now }, crypto: { randomUUID }, URL, Response, Request, AbortController, DOMException, structuredClone,
    setTimeout: (fn: () => void) => { callback = fn; return 1; }, clearTimeout: () => undefined,
    commitIdentity: () => undefined, document: { getElementById: () => ({}) },
    createRoot: () => ({ unmount: () => undefined, render: () => { mounts++; } }), React: { createElement: () => ({}) }, App: () => undefined,
    probe: undefined as unknown as typeof Harness };
  runInNewContext(js, context);
  return { api: context.probe, fetch: context.window.fetch as typeof window.fetch, advance: (ms: number) => { now += ms; }, runTimer: () => callback?.(),
    counts: () => ({ requests, mounts }) };
}
await test('late completion is unfinished even before an overdue timer can execute', () => {
  const h = fixture(); h.api.beginRun([{ scenario: 'login', count: 1 }], 250); h.api.beginCase('login'); h.api.beginUiPhase('protected-home');
  h.advance(300); h.api.finishCase('success');
  const result = h.api.finishRun(); assert.equal(result.samples[0].outcome, 'unfinished'); assert.equal(result.samples[0].phases[0].endedMs, null);
  // Browser serialization crosses the realm before the Node report consumes it.
  const dataset = JSON.parse(JSON.stringify(result)) as ReturnType<typeof Harness.finishRun>;
  assert.equal(createAuthMeasurementReport(dataset.manifest, dataset.samples).overall.metrics.successElapsedMs.n, 0);
});
await test('expired run forbids new API work and remount before and after its timer', async () => {
  for (const executeTimer of [false, true]) {
    const h = fixture(); h.api.beginRun([{ scenario: 'login', count: 1 }], 250); h.api.beginCase('login'); h.advance(300);
    if (executeTimer) h.runTimer();
    await assert.rejects(() => h.fetch('/api/auth/otp/verify'), /AUTH_MEASUREMENT_WINDOW_CLOSED/);
    assert.throws(() => h.api.mount(), /AUTH_MEASUREMENT_WINDOW_CLOSED/);
    assert.deepEqual(h.counts(), { requests: 0, mounts: 0 });
    h.api.finishRun();
  }
});
