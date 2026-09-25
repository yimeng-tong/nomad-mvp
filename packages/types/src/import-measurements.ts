/** Local/staging measurement contract, not an analytics SDK payload or business authority. */
import { measurementQuantiles as quantiles, measurementWindowIsValid, type MeasurementWindow, type Quantiles as Quantile } from './measurement-common.js';
export const importStages = ['created', 'fetching', 'parsing', 'geo', 'storing', 'done', 'failed'] as const;
export const importOutcomes = ['done', 'partial', 'failed', 'rejected', 'unknown', 'running'] as const;
export const importScenarios = ['single', 'batch', 'partial', 'failure', 'rejected', 'unknown-ack', 'reused', 'retry', 'reconnect', 'missing-terminal', 'missing-acceptance'] as const;
const timeKeys = ['confirmed', 'prepared', 'accepted', 'firstFact', 'terminal', 'presented', 'presentationEnded'] as const;
export type ImportMeasurementManifest = MeasurementWindow & {
  measurementVersion: 'nomad.import.v1'; workload: 'WL-IMPORT-DOCK'; mode: 'fixture' | 'staging' | 'production';
  scenarioPlan: Array<{ scenario: typeof importScenarios[number]; count: number }>; plannedLogicalRequests: number; fixtureVersion: string;
};
export type ImportMeasurementSample = {
  logicalId: string; clockId: string; scenario: typeof importScenarios[number]; outcome: typeof importOutcomes[number];
  disposition: 'created' | 'reused' | 'retried' | 'unknown'; acceptanceSource: 'direct' | 'reconciled' | 'unknown';
  operations: string[]; attemptsObserved: number[]; commandRequests: number; reconnects: number; duplicateFrames: number | null;
  times: Record<typeof timeKeys[number], number | null>; visibleMs: number | null; observedStages: Array<typeof importStages[number]>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const count = (value: unknown): value is number => finite(value) && Number.isSafeInteger(value) && value <= 1000000;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const enumValue = <T extends string>(value: unknown, allowed: readonly T[]): value is T => typeof value === 'string' && allowed.includes(value as T);
const sampleKeys = ['logicalId', 'clockId', 'scenario', 'outcome', 'disposition', 'acceptanceSource', 'operations', 'attemptsObserved', 'commandRequests', 'reconnects', 'duplicateFrames', 'times', 'visibleMs', 'observedStages'];

export function parseImportMeasurementSample(value: unknown): ImportMeasurementSample | null {
  try {
    if (!object(value) || !exact(value, sampleKeys) || typeof value.logicalId !== 'string' || !uuid.test(value.logicalId) || typeof value.clockId !== 'string' || !uuid.test(value.clockId)
      || !enumValue(value.scenario, importScenarios) || !enumValue(value.outcome, importOutcomes) || !enumValue(value.disposition, ['created', 'reused', 'retried', 'unknown'] as const)
      || !enumValue(value.acceptanceSource, ['direct', 'reconciled', 'unknown'] as const)
      || !Array.isArray(value.operations) || value.operations.length > 100 || !value.operations.every((id) => typeof id === 'string' && uuid.test(id))
      || !Array.isArray(value.attemptsObserved) || value.attemptsObserved.length > 100 || !value.attemptsObserved.every((attempt) => count(attempt) && attempt > 0)
      || !count(value.commandRequests) || !count(value.reconnects) || value.duplicateFrames !== null && !count(value.duplicateFrames)
      || !object(value.times) || !exact(value.times, timeKeys) || !timeKeys.every((key) => value.times && ((value.times as Record<string, unknown>)[key] === null || finite((value.times as Record<string, unknown>)[key])))
      || value.visibleMs !== null && !finite(value.visibleMs) || !Array.isArray(value.observedStages) || value.observedStages.length > 100 || !value.observedStages.every((stage) => enumValue(stage, importStages))) return null;
    return {
      logicalId: value.logicalId, clockId: value.clockId, scenario: value.scenario, outcome: value.outcome,
      disposition: value.disposition, acceptanceSource: value.acceptanceSource,
      operations: [...new Set(value.operations as string[])].sort(), attemptsObserved: [...new Set(value.attemptsObserved as number[])].sort((a, b) => a - b),
      commandRequests: value.commandRequests, reconnects: value.reconnects, duplicateFrames: value.duplicateFrames as number | null,
      times: Object.fromEntries(timeKeys.map((key) => [key, (value.times as Record<string, number | null>)[key]])) as ImportMeasurementSample['times'],
      visibleMs: value.visibleMs as number | null, observedStages: [...new Set(value.observedStages)].sort(),
    };
  } catch { return null; }
}
export function validateImportMeasurementManifest(value: unknown): asserts value is ImportMeasurementManifest {
  const fields = ['measurementVersion', 'workload', 'mode', 'clockId', 'scenarioPlan', 'plannedLogicalRequests', 'windowStartMs', 'windowEndMs', 'deadlineMs', 'fixtureVersion', 'sampling'];
  if (!object(value) || !exact(value, fields) || value.measurementVersion !== 'nomad.import.v1' || value.workload !== 'WL-IMPORT-DOCK'
    || !enumValue(value.mode, ['fixture', 'staging', 'production'] as const) || typeof value.clockId !== 'string' || !uuid.test(value.clockId)
    || !Array.isArray(value.scenarioPlan) || value.scenarioPlan.length > importScenarios.length
    || !value.scenarioPlan.every((item) => object(item) && exact(item, ['scenario', 'count']) && enumValue(item.scenario, importScenarios) && count(item.count) && item.count > 0)
    || new Set((value.scenarioPlan as ImportMeasurementManifest['scenarioPlan']).map((item) => item.scenario)).size !== value.scenarioPlan.length
    || (value.scenarioPlan as ImportMeasurementManifest['scenarioPlan']).reduce((sum, item) => sum + item.count, 0) !== value.plannedLogicalRequests
    || !count(value.plannedLogicalRequests) || !measurementWindowIsValid(value) || typeof value.fixtureVersion !== 'string' || !/^[a-z][a-z0-9._-]{0,79}$/i.test(value.fixtureVersion)) throw new Error('MEASUREMENT_MANIFEST_INVALID');
}
function globalConflicts(input: unknown[]) {
  if (!Array.isArray(input) || input.length > 20000) throw new Error('MEASUREMENT_INPUT_INVALID');
  const values = new Map<string, string>(), conflicts = new Set<string>();
  for (const raw of input) {
    const sample = parseImportMeasurementSample(raw); if (!sample) continue;
    const value = JSON.stringify(sample), prior = values.get(sample.logicalId);
    if (prior !== undefined && prior !== value) conflicts.add(sample.logicalId);
    else values.set(sample.logicalId, value);
  }
  return conflicts;
}
export function summarizeImportMeasurements(manifest: ImportMeasurementManifest, input: unknown[], inheritedConflicts?: ReadonlySet<string>) {
  validateImportMeasurementManifest(manifest);
  if (!Array.isArray(input) || input.length > 20000) throw new Error('MEASUREMENT_INPUT_INVALID');
  const canonical = new Map<string, ImportMeasurementSample>(), conflicts = new Set(inheritedConflicts ?? globalConflicts(input));
  const coverage = { plannedLogicalRequests: manifest.plannedLogicalRequests, rawSamples: input.length, observedLogicalRequests: 0,
    missingLogicalRequests: 0, extraLogicalRequests: 0, invalidSamples: 0, duplicateSamples: 0, conflictingSamples: 0,
    unplannedScenario: 0, invalidClock: 0, invalidTiming: 0, outsideWindow: 0, missingAcceptance: 0, missingTerminal: 0 };
  for (const raw of input) {
    const sample = parseImportMeasurementSample(raw);
    if (!sample) { coverage.invalidSamples++; continue; }
    if (!manifest.scenarioPlan.some((plan) => plan.scenario === sample.scenario)) { coverage.unplannedScenario++; continue; }
    const prior = canonical.get(sample.logicalId);
    if (prior) { if (JSON.stringify(prior) === JSON.stringify(sample)) coverage.duplicateSamples++; else conflicts.add(sample.logicalId); }
    else canonical.set(sample.logicalId, sample);
  }
  coverage.observedLogicalRequests = canonical.size;
  coverage.missingLogicalRequests = Math.max(0, manifest.plannedLogicalRequests - canonical.size);
  coverage.extraLogicalRequests = Math.max(0, canonical.size - manifest.plannedLogicalRequests);
  coverage.conflictingSamples = [...canonical.keys()].filter((id) => conflicts.has(id)).length;
  const outcomes = Object.fromEntries(importOutcomes.map((outcome) => [outcome, 0])) as Record<typeof importOutcomes[number], number>;
  const pools = { acceptanceMs: [] as number[], firstFactMs: [] as number[], successElapsedMs: [] as number[], allTerminalElapsedMs: [] as number[],
    acceptedToTerminalMs: [] as number[], terminalToPresentationMs: [] as number[], visibleWindowMs: [] as number[] };
  const exclusions = { reusedProcessing: 0, recoveredAcceptance: 0, retriedProcessing: 0, unknownAttempt: 0, unknownDisposition: 0 };
  const presentation = { completedWindows: 0, incompleteWindows: 0, notPresented: 0 };
  const stages = Object.fromEntries(importStages.map((stage) => [stage, 0])) as Record<typeof importStages[number], number>;
  const unfinished: Array<{ logicalId: string; outcome: 'unknown' | 'running'; waitedMs: number | null }> = [];
  let operations = 0, observedAttempts = 0, commandRequests = 0, reconnects = 0, duplicateFrames = 0, missingFrameCoverage = 0;
  const delta = (end: number | null, start: number | null, pool: number[]) => { if (end !== null && start !== null && end >= start) pool.push(end - start); };
  for (const sample of canonical.values()) {
    if (conflicts.has(sample.logicalId)) continue;
    outcomes[sample.outcome]++; operations += sample.operations.length; observedAttempts += sample.attemptsObserved.length;
    commandRequests += sample.commandRequests; reconnects += sample.reconnects;
    if (sample.duplicateFrames === null) missingFrameCoverage++; else duplicateFrames += sample.duplicateFrames;
    for (const stage of sample.observedStages) stages[stage]++;
    const times = sample.times, terminal = ['done', 'partial', 'failed', 'rejected'].includes(sample.outcome);
    if (times.accepted === null) coverage.missingAcceptance++;
    if (terminal && times.terminal === null) coverage.missingTerminal++;
    if (!terminal) unfinished.push({ logicalId: sample.logicalId, outcome: sample.outcome as 'unknown' | 'running',
      waitedMs: sample.clockId === manifest.clockId && times.confirmed !== null && times.confirmed <= manifest.windowEndMs ? manifest.windowEndMs - Math.max(times.confirmed, manifest.windowStartMs) : null });
    if (sample.disposition === 'reused') exclusions.reusedProcessing++;
    if (sample.acceptanceSource === 'reconciled') exclusions.recoveredAcceptance++;
    const retried = sample.disposition === 'retried' || sample.attemptsObserved.some((attempt) => attempt > 1);
    if (retried) exclusions.retriedProcessing++;
    if (sample.attemptsObserved.length === 0) exclusions.unknownAttempt++;
    if (sample.disposition === 'unknown') exclusions.unknownDisposition++;
    if (sample.clockId !== manifest.clockId) { coverage.invalidClock++; continue; }
    const presentTimes = timeKeys.flatMap((key) => times[key] === null ? [] : [times[key]!]);
    if (presentTimes.some((time) => time < manifest.windowStartMs || time > manifest.windowEndMs)) { coverage.outsideWindow++; continue; }
    if (presentTimes.some((time, index) => index > 0 && time < presentTimes[index - 1])) { coverage.invalidTiming++; continue; }
    delta(times.accepted, times.confirmed, pools.acceptanceMs);
    delta(times.firstFact, times.accepted, pools.firstFactMs);
    if (terminal) delta(times.terminal, times.confirmed, pools.allTerminalElapsedMs);
    if (sample.outcome === 'done' && sample.disposition !== 'reused') delta(times.terminal, times.confirmed, pools.successElapsedMs);
    if (terminal && sample.disposition === 'created' && sample.acceptanceSource === 'direct' && !retried && sample.attemptsObserved.length === 1 && sample.attemptsObserved[0] === 1) delta(times.terminal, times.accepted, pools.acceptedToTerminalMs);
    if (sample.outcome === 'done' && sample.disposition !== 'reused') {
      delta(times.presented, times.terminal, pools.terminalToPresentationMs);
      if (times.presented === null) presentation.notPresented++;
      else if (times.presentationEnded === null || sample.visibleMs === null) presentation.incompleteWindows++;
      else if (sample.visibleMs <= times.presentationEnded - times.presented) { presentation.completedWindows++; pools.visibleWindowMs.push(sample.visibleMs); }
      else coverage.invalidTiming++;
    }
  }
  return {
    manifest: { ...manifest },
    measurementVersion: manifest.measurementVersion, workload: manifest.workload, mode: manifest.mode,
    quantileMethod: 'nearest-rank-ceil-p-times-n', coverage, outcomes, operations, observedAttempts, commandRequests, reconnects, duplicateFrames, missingFrameCoverage,
    exclusions, presentation, stagesObservedInSamples: stages, unfinished,
    metrics: Object.fromEntries(Object.entries(pools).map(([key, values]) => [key, quantiles(values)])) as Record<keyof typeof pools, Quantile>,
    cost: { amount: null, currency: null, reason: 'not-measured' },
    serverCommitToPresentation: { n: 0, p50: null, p95: null, reason: 'server-clock-not-calibrated' },
    notes: ['Client observations are not provider execution time.', 'Logical requests and observed attempts have separate denominators.', 'Visible FIFO duration is not parsing time.', 'No cancellation or authoritative timeout capability is inferred.'],
  };
}


/** Shared statistical envelope; environment/source provenance stays in the original runner report. */
export function createImportMeasurementReport(manifest: ImportMeasurementManifest, input: unknown[]) {
  const conflicts = globalConflicts(input);
  const overall = summarizeImportMeasurements(manifest, input, conflicts);
  const scenarios = manifest.scenarioPlan.map((plan) => ({ scenario: plan.scenario,
    report: summarizeImportMeasurements({ ...manifest, plannedLogicalRequests: plan.count, scenarioPlan: [plan] },
      input.filter((sample) => parseImportMeasurementSample(sample)?.scenario === plan.scenario), conflicts),
  }));
  return { overall, scenarios };
}
