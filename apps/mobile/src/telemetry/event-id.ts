/** Fixed SHA-256 UUIDv8 profile; references identify observations, never authority. */
export const inputEventIdProfile = 'nomad-input-event-v1';
export type InputJobEventName = 'ingest_job_created' | 'ingest_presented';
const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const v8 = /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isTelemetryEventId(name: string, value: unknown): value is string {
  return typeof value === 'string' && value.length === 36 && (v4.test(value) || ['ingest_job_created', 'ingest_presented'].includes(name) && v8.test(value));
}
export async function deriveInputEventId(name: InputJobEventName, jobId: string, attempt: number): Promise<string | null> {
  if (!['ingest_job_created', 'ingest_presented'].includes(name) || typeof jobId !== 'string' || jobId.length !== 40 || !jobId.startsWith('ing_') || !v4.test(jobId.slice(4))
    || !Number.isSafeInteger(attempt) || attempt < 1 || attempt > 10000 || name === 'ingest_job_created' && attempt !== 1) return null;
  try {
    const bytes = new TextEncoder().encode(JSON.stringify([inputEventIdProfile, name, jobId.slice(4).toLowerCase(), attempt]));
    const digest = await crypto.subtle.digest('SHA-256', bytes); if (digest.byteLength !== 32) return null;
    const id = new Uint8Array(digest).slice(0, 16); id[6] = (id[6] & 0x0f) | 0x80; id[8] = (id[8] & 0x3f) | 0x80;
    const hex = [...id].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch { return null; }
}
