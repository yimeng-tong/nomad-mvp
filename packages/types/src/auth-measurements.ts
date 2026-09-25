import { measurementQuantiles, measurementWindowIsValid, type MeasurementWindow, type Quantiles } from './measurement-common.js';

export const authScenarios = ['login', 'send-rejected', 'send-unknown', 'verify-rejected', 'restore', 'invalid-session', 'authority-unavailable', 'logout', 'logout-recovery', 'missing-terminal'] as const;
export const authPhases = ['otp-send', 'proof-verify', 'identity-read', 'protected-home', 'logout', 'logout-recovery'] as const;
export const authOutcomes = ['success', 'rejected', 'unknown', 'unavailable', 'unfinished'] as const;
export type AuthOutcome = typeof authOutcomes[number];
export type AuthPhase = { phase: typeof authPhases[number]; attempt: number; startedMs: number; endedMs: number | null; outcome: AuthOutcome };
export type AuthMeasurementManifest = MeasurementWindow & {
  measurementVersion: 'nomad.auth.v1'; workload: 'WL-AUTH'; mode: 'fixture' | 'staging' | 'production';
  scenarioPlan: Array<{ scenario: typeof authScenarios[number]; count: number }>; plannedLogicalRequests: number;
  fixtureVersion: string; concurrency: 1; retryPolicy: 'explicit-only'; cacheMode: 'one-browser-app-remount';
};
export type AuthMeasurementSample = {
  logicalId: string; clockId: string; scenario: typeof authScenarios[number]; outcome: AuthOutcome;
  startedMs: number; observedUntilMs: number; apiRequests: number; recoveredOriginalOperation: boolean | null; phases: AuthPhase[];
};
const expectedPhases: Record<AuthMeasurementSample['scenario'], readonly AuthPhase['phase'][]> = {
  login: ['otp-send', 'proof-verify', 'identity-read', 'protected-home'], 'send-rejected': ['otp-send'], 'send-unknown': ['otp-send'],
  'verify-rejected': ['otp-send', 'proof-verify', 'protected-home'], restore: ['identity-read', 'protected-home'],
  'invalid-session': ['identity-read', 'protected-home'], 'authority-unavailable': ['identity-read', 'protected-home'],
  logout: ['logout', 'identity-read'], 'logout-recovery': ['logout', 'identity-read', 'logout-recovery'], 'missing-terminal': ['otp-send', 'proof-verify', 'protected-home'],
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
const count = (v: unknown): v is number => finite(v) && Number.isSafeInteger(v) && v <= 10000;
const enumValue = <T extends string>(v: unknown, allowed: readonly T[]): v is T => typeof v === 'string' && allowed.includes(v as T);
function data(v: unknown, keys: readonly string[]): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) return false;
  const descriptors = Object.getOwnPropertyDescriptors(v), names = Reflect.ownKeys(descriptors);
  return names.length === keys.length && names.every((key) => typeof key === 'string' && keys.includes(key) && 'value' in descriptors[key]);
}
export function validateAuthMeasurementManifest(v: unknown): asserts v is AuthMeasurementManifest {
  try {
    if (data(v, ['measurementVersion', 'workload', 'mode', 'clockId', 'scenarioPlan', 'plannedLogicalRequests', 'windowStartMs', 'windowEndMs', 'deadlineMs', 'fixtureVersion', 'sampling', 'concurrency', 'retryPolicy', 'cacheMode'])
      && v.measurementVersion === 'nomad.auth.v1' && v.workload === 'WL-AUTH' && enumValue(v.mode, ['fixture', 'staging', 'production'] as const)
      && measurementWindowIsValid(v) && typeof v.clockId === 'string' && uuid.test(v.clockId) && typeof v.sampling === 'number' && v.sampling > 0 && v.concurrency === 1
      && v.retryPolicy === 'explicit-only' && v.cacheMode === 'one-browser-app-remount' && typeof v.fixtureVersion === 'string' && /^[a-z][a-z0-9._-]{0,79}$/i.test(v.fixtureVersion)
      && count(v.plannedLogicalRequests) && Array.isArray(v.scenarioPlan) && v.scenarioPlan.length <= authScenarios.length
      && v.scenarioPlan.every((p) => data(p, ['scenario', 'count']) && enumValue(p.scenario, authScenarios) && count(p.count) && p.count > 0)
      && new Set(v.scenarioPlan.map((p: { scenario: string }) => p.scenario)).size === v.scenarioPlan.length
      && v.scenarioPlan.reduce((n: number, p: { count: number }) => n + p.count, 0) === v.plannedLogicalRequests) return;
  } catch { /* Report only the typed failure, never input fields. */ }
  throw new Error('AUTH_MEASUREMENT_MANIFEST_INVALID');
}
export function parseAuthMeasurementSample(v: unknown): AuthMeasurementSample | null {
  try {
    if (!data(v, ['logicalId', 'clockId', 'scenario', 'outcome', 'startedMs', 'observedUntilMs', 'apiRequests', 'recoveredOriginalOperation', 'phases'])
      || typeof v.logicalId !== 'string' || !uuid.test(v.logicalId) || typeof v.clockId !== 'string' || !uuid.test(v.clockId)
      || !enumValue(v.scenario, authScenarios) || !enumValue(v.outcome, authOutcomes) || !finite(v.startedMs) || !finite(v.observedUntilMs)
      || !count(v.apiRequests) || ![null, true, false].includes(v.recoveredOriginalOperation as null | boolean)
      || !Array.isArray(v.phases) || v.phases.length > 128) return null;
    const phases: AuthPhase[] = [], attempts = new Map<AuthPhase['phase'], number>();
    for (const p of v.phases) {
      if (!data(p, ['phase', 'attempt', 'startedMs', 'endedMs', 'outcome']) || !enumValue(p.phase, authPhases) || !count(p.attempt) || p.attempt < 1
        || !finite(p.startedMs) || p.endedMs !== null && !finite(p.endedMs) || !enumValue(p.outcome, authOutcomes)
        || (p.endedMs === null) !== (p.outcome === 'unfinished') || p.attempt !== (attempts.get(p.phase) ?? 0) + 1) return null;
      attempts.set(p.phase, p.attempt);
      phases.push({ phase: p.phase, attempt: p.attempt, startedMs: p.startedMs, endedMs: p.endedMs, outcome: p.outcome });
    }
    if (v.apiRequests < phases.filter((p) => !['protected-home', 'logout-recovery'].includes(p.phase)).length) return null;
    if (v.recoveredOriginalOperation !== null && v.scenario !== 'logout-recovery') return null;
    return { logicalId: v.logicalId.toLowerCase(), clockId: v.clockId.toLowerCase(), scenario: v.scenario, outcome: v.outcome,
      startedMs: v.startedMs, observedUntilMs: v.observedUntilMs, apiRequests: v.apiRequests,
      recoveredOriginalOperation: v.recoveredOriginalOperation as boolean | null, phases };
  } catch { return null; }
}
function findConflicts(input: unknown[]) {
  if (!Array.isArray(input) || input.length > 20000) throw new Error('AUTH_MEASUREMENT_INPUT_INVALID');
  const signatures = new Map<string, string>(), conflicts = new Set<string>();
  for (const raw of input) {
    const s = parseAuthMeasurementSample(raw); if (!s) continue;
    const signature = JSON.stringify(s), old = signatures.get(s.logicalId);
    if (old !== undefined && old !== signature) conflicts.add(s.logicalId); else signatures.set(s.logicalId, signature);
  }
  return conflicts;
}
function summarize(manifest: AuthMeasurementManifest, input: unknown[], conflicts: ReadonlySet<string>) {
  const canonical = new Map<string, AuthMeasurementSample>(), seenSignatures = new Set<string>();
  const coverage = { plannedLogicalRequests: manifest.plannedLogicalRequests, rawSamples: input.length, observedLogicalRequests: 0, missingLogicalRequests: 0,
    extraLogicalRequests: 0, invalidSamples: 0, duplicateSamples: 0, conflictingSamples: 0, unplannedScenario: 0, invalidClock: 0, outsideWindow: 0, invalidTiming: 0 };
  for (const raw of input) {
    const s = parseAuthMeasurementSample(raw);
    if (!s) { coverage.invalidSamples++; continue; }
    if (!manifest.scenarioPlan.some((p) => p.scenario === s.scenario)) { coverage.unplannedScenario++; continue; }
    const signature = JSON.stringify(s);
    if (seenSignatures.has(signature)) coverage.duplicateSamples++;
    seenSignatures.add(signature);
    if (!canonical.has(s.logicalId)) canonical.set(s.logicalId, s);
  }
  const usable = [...canonical.values()].filter((s) => !conflicts.has(s.logicalId));
  coverage.observedLogicalRequests = usable.length;
  for (const plan of manifest.scenarioPlan) {
    const observed = usable.filter((s) => s.scenario === plan.scenario).length;
    coverage.missingLogicalRequests += Math.max(0, plan.count - observed);
    coverage.extraLogicalRequests += Math.max(0, observed - plan.count);
  }
  coverage.conflictingSamples = [...canonical.keys()].filter((id) => conflicts.has(id)).length;
  const outcomes = Object.fromEntries(authOutcomes.map((k) => [k, 0])) as Record<AuthOutcome, number>;
  const phases = Object.fromEntries(authPhases.map((k) => [k, { plannedCases: manifest.scenarioPlan.filter((p) => expectedPhases[p.scenario].includes(k)).reduce((n, p) => n + p.count, 0),
    observedCases: 0, attempts: 0, retryAttempts: 0, unfinished: 0, outcomes: { ...outcomes }, responseMs: [] as number[], successMs: [] as number[] }])) as Record<AuthPhase['phase'], { plannedCases: number; observedCases: number; attempts: number; retryAttempts: number; unfinished: number; outcomes: typeof outcomes; responseMs: number[]; successMs: number[] }>;
  const elapsed: number[] = [], terminal: number[] = [], unfinished: Array<{ logicalId: string; outcome: 'unknown' | 'unfinished'; waitedMs: number | null }> = [];
  const phaseCases = new Map<string, number>();
  let apiRequests = 0, originalLogoutRecoveries = 0;
  for (const s of usable) {
    outcomes[s.outcome]++; apiRequests += s.apiRequests;
    if (s.recoveredOriginalOperation === true && s.outcome === 'success') originalLogoutRecoveries++;
    const sameClock = s.clockId === manifest.clockId.toLowerCase();
    if (s.outcome === 'unknown' || s.outcome === 'unfinished') unfinished.push({ logicalId: s.logicalId, outcome: s.outcome,
      waitedMs: sameClock && s.observedUntilMs >= s.startedMs && s.startedMs >= manifest.windowStartMs && s.observedUntilMs <= manifest.windowEndMs ? s.observedUntilMs - s.startedMs : null });
    if (!sameClock) { coverage.invalidClock++; continue; }
    if (s.startedMs < manifest.windowStartMs || s.observedUntilMs > manifest.windowEndMs) { coverage.outsideWindow++; continue; }
    if (s.observedUntilMs < s.startedMs || s.phases.some((p) => p.startedMs < s.startedMs || p.startedMs > s.observedUntilMs
      || p.endedMs !== null && (p.endedMs < p.startedMs || p.endedMs > s.observedUntilMs))) { coverage.invalidTiming++; continue; }
    if (s.outcome === 'success') elapsed.push(s.observedUntilMs - s.startedMs);
    if (s.outcome !== 'unknown' && s.outcome !== 'unfinished') terminal.push(s.observedUntilMs - s.startedMs);
    for (const k of new Set(s.phases.map((p) => p.phase))) {
      phases[k].observedCases++;
      const key = `${s.scenario}:${k}`; phaseCases.set(key, (phaseCases.get(key) ?? 0) + 1);
    }
    for (const p of s.phases) {
      const group = phases[p.phase]; group.attempts++; group.retryAttempts += p.attempt > 1 ? 1 : 0; group.outcomes[p.outcome]++;
      if (p.endedMs === null) group.unfinished++;
      else { const ms = p.endedMs - p.startedMs; group.responseMs.push(ms); if (p.outcome === 'success') group.successMs.push(ms); }
    }
  }
  return { manifest: structuredClone(manifest), measurementVersion: manifest.measurementVersion, workload: manifest.workload, mode: manifest.mode,
    quantileMethod: 'nearest-rank-ceil-p-times-n', coverage, outcomes, apiRequests, originalLogoutRecoveries, unfinished: unfinished.sort((a, b) => a.logicalId.localeCompare(b.logicalId)),
    metrics: { successElapsedMs: measurementQuantiles(elapsed), observedTerminalMs: measurementQuantiles(terminal) },
    phases: Object.fromEntries(authPhases.map((k) => [k, { ...phases[k],
      notObservedCases: manifest.scenarioPlan.filter((p) => expectedPhases[p.scenario].includes(k)).reduce((n, p) => n + Math.max(0, p.count - (phaseCases.get(`${p.scenario}:${k}`) ?? 0)), 0),
      unexpectedCases: manifest.scenarioPlan.filter((p) => !expectedPhases[p.scenario].includes(k)).reduce((n, p) => n + (phaseCases.get(`${p.scenario}:${k}`) ?? 0), 0),
      responseMs: measurementQuantiles(phases[k].responseMs), successMs: measurementQuantiles(phases[k].successMs) }])) as Record<AuthPhase['phase'], { plannedCases: number; observedCases: number; notObservedCases: number; unexpectedCases: number; attempts: number; retryAttempts: number; unfinished: number; outcomes: typeof outcomes; responseMs: Quantiles; successMs: Quantiles }>,
    cost: { amount: null, currency: null, reason: 'not-measured' },
    providerExecution: { n: 0, p50: null, p95: null, reason: 'client-observation-is-not-provider-execution' },
    notes: ['OTP send success is not authentication.', 'HTTP proof acceptance is separate from current identity and protected UI.', 'Unknown and unfinished cases stay outside success latency.', 'Input mode does not certify staging, provider, device or production acceptance.'],
  };
}
export function createAuthMeasurementReport(manifest: AuthMeasurementManifest, input: unknown[]) {
  validateAuthMeasurementManifest(manifest); const conflicts = findConflicts(input);
  return { overall: summarize(manifest, input, conflicts), scenarios: manifest.scenarioPlan.map((p) => ({ scenario: p.scenario,
    report: summarize({ ...manifest, plannedLogicalRequests: p.count, scenarioPlan: [p] }, input.filter((raw) => parseAuthMeasurementSample(raw)?.scenario === p.scenario), conflicts) })) };
}
