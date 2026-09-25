/** Shared public window and quantile contract. Every capability keeps its own event boundaries. */
export type MeasurementWindow = {
  clockId: string; windowStartMs: number; windowEndMs: number; deadlineMs: number; sampling: number;
};
export type Quantiles = { n: number; p50: number | null; p95: number | null };
export function measurementWindowIsValid(value: Record<string, unknown>): boolean {
  const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= Number.MAX_SAFE_INTEGER;
  return typeof value.clockId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.clockId)
    && finite(value.windowStartMs) && finite(value.windowEndMs) && value.windowEndMs >= value.windowStartMs
    && finite(value.deadlineMs) && value.windowEndMs <= value.windowStartMs + value.deadlineMs
    && finite(value.sampling) && value.sampling <= 1;
}
export function measurementQuantiles(values: readonly number[]): Quantiles {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length;
  return { n, p50: n ? sorted[Math.ceil(0.5 * n) - 1] : null, p95: n ? sorted[Math.ceil(0.95 * n) - 1] : null };
}
