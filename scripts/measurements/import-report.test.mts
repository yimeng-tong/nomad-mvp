import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeImportMeasurements, createImportMeasurementReport, type ImportMeasurementSample, type ImportMeasurementManifest } from '../../packages/types/src/import-measurements.js';

const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const manifest: ImportMeasurementManifest = {
  measurementVersion: 'nomad.import.v1', workload: 'WL-IMPORT-DOCK', mode: 'fixture', clockId: id(100), plannedLogicalRequests: 4, scenarioPlan: [{ scenario: 'single', count: 4 }],
  windowStartMs: 0, windowEndMs: 1000, deadlineMs: 1000, fixtureVersion: 'import-fixture-v1', sampling: 1,
};
const sample = (n: number, acceptance: number, outcome: ImportMeasurementSample['outcome'] = 'done'): ImportMeasurementSample => ({
  logicalId: id(n), clockId: manifest.clockId, scenario: 'single', outcome, disposition: 'created', acceptanceSource: 'direct',
  operations: [id(n)], attemptsObserved: [1], commandRequests: 1, reconnects: 0, duplicateFrames: 0,
  times: { confirmed: 0, prepared: 1, accepted: acceptance, firstFact: acceptance + 1, terminal: acceptance + 10, presented: null, presentationEnded: null }, visibleMs: null,
  observedStages: ['created', 'fetching', 'storing', 'done'],
});
test('uses nearest-rank quantiles and separates success, partial and all-terminal denominators', () => {
  const report = summarizeImportMeasurements(manifest, [sample(1, 1), sample(2, 2), sample(3, 10, 'failed'), sample(4, 100, 'partial')]);
  assert.deepEqual(report.metrics.acceptanceMs, { n: 4, p50: 2, p95: 100 });
  assert.equal(report.metrics.successElapsedMs.n, 2); assert.equal(report.metrics.allTerminalElapsedMs.n, 4);
  assert.deepEqual(report.outcomes, { done: 2, partial: 1, failed: 1, rejected: 0, unknown: 0, running: 0 });
});
test('unfinished and missing events stay in coverage and never manufacture a duration', () => {
  const pending = { ...sample(1, 5, 'running'), times: { ...sample(1, 5).times, terminal: null } };
  const unknown = { ...sample(2, 5, 'unknown'), acceptanceSource: 'unknown' as const, times: { confirmed: 0, prepared: 1, accepted: null, firstFact: null, terminal: null, presented: null, presentationEnded: null } };
  const report = summarizeImportMeasurements(manifest, [pending, unknown]);
  assert.equal(report.coverage.plannedLogicalRequests, 4); assert.equal(report.coverage.observedLogicalRequests, 2); assert.equal(report.coverage.missingLogicalRequests, 2);
  assert.deepEqual(report.metrics.allTerminalElapsedMs, { n: 0, p50: null, p95: null });
  assert.deepEqual(report.unfinished.map((row) => row.waitedMs), [1000, 1000]);
});
test('retry operations remain one logical request and replays are counted without double counting', () => {
  const retried = { ...sample(1, 10), operations: [id(1), id(2)], attemptsObserved: [1, 2], commandRequests: 3, reconnects: 1, duplicateFrames: 2 };
  const report = summarizeImportMeasurements({ ...manifest, plannedLogicalRequests: 1, scenarioPlan: [{ scenario: 'single', count: 1 }] }, [retried, structuredClone(retried)]);
  assert.equal(report.coverage.observedLogicalRequests, 1); assert.equal(report.coverage.duplicateSamples, 1);
  assert.equal(report.operations, 2); assert.equal(report.observedAttempts, 2); assert.equal(report.commandRequests, 3);
});
test('reused results and recovered acknowledgments cannot be counted as new processing performance', () => {
  const report = summarizeImportMeasurements(manifest, [{ ...sample(1, 5), disposition: 'reused' }, { ...sample(2, 20), acceptanceSource: 'reconciled' }]);
  assert.equal(report.metrics.acceptanceMs.n, 2); assert.equal(report.metrics.acceptedToTerminalMs.n, 0);
  assert.equal(report.exclusions.reusedProcessing, 1); assert.equal(report.exclusions.recoveredAcceptance, 1);
});
test('incompatible clocks, reversed timestamps and conflicting replay values are visible exclusions', () => {
  const conflicting = sample(3, 10);
  const report = summarizeImportMeasurements(manifest, [{ ...sample(1, 10), clockId: id(101) }, { ...sample(2, 10), times: { ...sample(2, 10).times, accepted: -1 } }, conflicting, { ...conflicting, outcome: 'failed' }]);
  assert.equal(report.coverage.invalidClock, 1); assert.equal(report.coverage.invalidSamples, 1); assert.equal(report.coverage.conflictingSamples, 1);
  assert.equal(report.metrics.successElapsedMs.n, 0);
});
test('unknown properties, unsafe references and private strings cannot enter reports', () => {
  const report = summarizeImportMeasurements(manifest, [{ ...sample(1, 1), note: 'private sentinel phone=13800138000' }, { ...sample(2, 1), logicalId: 'https://private.example/?token=sentinel' }]);
  assert.equal(report.coverage.invalidSamples, 2); assert.equal(JSON.stringify(report).includes('sentinel'), false);
  assert.equal(report.cost.amount, null); assert.equal(report.cost.reason, 'not-measured');
});
test('FIFO visible duration has its own metric and missing presentation is not a parsing failure', () => {
  const shown = { ...sample(1, 1), times: { ...sample(1, 1).times, presented: 20, presentationEnded: 10020 }, visibleMs: 10000 };
  const report = summarizeImportMeasurements({ ...manifest, windowEndMs: 11000, deadlineMs: 11000 }, [shown, sample(2, 2)]);
  assert.deepEqual(report.metrics.visibleWindowMs, { n: 1, p50: 10000, p95: 10000 });
  assert.equal(report.presentation.completedWindows, 1); assert.equal(report.presentation.notPresented, 1);
  assert.equal(report.metrics.successElapsedMs.p95, 12);
});

test('missing terminal timestamps and out-of-window or reversed observations remain explicit exclusions', () => {
  const missing = { ...sample(1, 10), times: { ...sample(1, 10).times, terminal: null } };
  const reversed = { ...sample(2, 10), times: { ...sample(2, 10).times, firstFact: 9 } };
  const outside = { ...sample(3, 10), times: { ...sample(3, 10).times, terminal: 1001 } };
  const report = summarizeImportMeasurements(manifest, [missing, reversed, outside]);
  assert.equal(report.coverage.missingTerminal, 1); assert.equal(report.coverage.invalidTiming, 1); assert.equal(report.coverage.outsideWindow, 1);
  assert.equal(report.outcomes.done, 3); assert.equal(report.metrics.successElapsedMs.n, 0);
});

test('retry attempts cannot accidentally enter the single-attempt processing pool', () => {
  const report = summarizeImportMeasurements(manifest, [{ ...sample(1, 5), disposition: 'retried', attemptsObserved: [1, 2] }]);
  assert.equal(report.metrics.acceptedToTerminalMs.n, 0); assert.equal(report.exclusions.retriedProcessing, 1);
  assert.equal(report.metrics.successElapsedMs.n, 1);
});

test('a recovered retry or unknown attempt coverage never becomes proof of an initial attempt', () => {
  for (const item of [
    { ...sample(1, 5), disposition: 'retried' as const, attemptsObserved: [2] },
    { ...sample(2, 5), attemptsObserved: [2] },
    { ...sample(3, 5), attemptsObserved: [] },
  ]) assert.equal(summarizeImportMeasurements(manifest, [item]).metrics.acceptedToTerminalMs.n, 0);
});

test('reports preserve the validated workload window, sampling and fixture identity', () => {
  assert.deepEqual(summarizeImportMeasurements(manifest, []).manifest, manifest);
});

test('recalculated reports retain planned per-scenario denominators, including wholly missing scenarios', () => {
  const report = createImportMeasurementReport({ ...manifest, scenarioPlan: [{ scenario: 'single', count: 3 }, { scenario: 'reconnect', count: 1 }] }, [sample(1, 5)]);
  assert.equal(report.scenarios[0].report.coverage.missingLogicalRequests, 2);
  assert.equal(report.scenarios[1].report.coverage.missingLogicalRequests, 1);
  assert.equal(report.scenarios[1].report.metrics.acceptanceMs.p95, null);
});

test('cross-scenario conflicts remain excluded from every report, including unplanned variants', () => {
  const samples = [sample(1, 5), { ...sample(1, 5), scenario: 'batch' as const }];
  const report = createImportMeasurementReport({ ...manifest, plannedLogicalRequests: 2, scenarioPlan: [{ scenario: 'single', count: 1 }, { scenario: 'batch', count: 1 }] }, samples);
  for (const part of [report.overall, ...report.scenarios.map((row) => row.report)]) {
    assert.equal(part.coverage.conflictingSamples, 1); assert.equal(part.metrics.successElapsedMs.n, 0);
  }
  const unplanned = createImportMeasurementReport(manifest, samples);
  assert.equal(unplanned.overall.coverage.unplannedScenario, 1);
  assert.equal(unplanned.overall.coverage.conflictingSamples, 1);
  assert.equal(unplanned.scenarios[0].report.metrics.successElapsedMs.n, 0);
});
