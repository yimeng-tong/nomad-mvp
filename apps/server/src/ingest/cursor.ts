import { AuthFault } from '../auth/errors.js';

/** Public per-job log position, never an authentication credential. Authorize the job before resolving it. */
export const MAX_INGEST_SEQ = 9223372036854775807n;
const streamPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const validStream = (value: unknown): value is string => typeof value === 'string' && value.length === 36 && streamPattern.test(value);
const validSeq = (value: unknown): value is bigint => typeof value === 'bigint' && value >= 0n && value <= MAX_INGEST_SEQ;
const unavailable = () => new AuthFault('INGEST_EVENT_STATE_UNAVAILABLE', 503, true);
const invalid = () => new AuthFault('INGEST_CURSOR_INVALID', 400, false);
export function encodeIngestCursor(streamId: string, seq: bigint): string {
  if (!validStream(streamId) || !validSeq(seq)) throw unavailable();
  return `i1:${streamId}:${seq.toString()}`;
}
export function parseIngestCursor(value: unknown): { streamId: string; seq: bigint } {
  if (typeof value !== 'string' || value.length > 128) throw invalid();
  const match = /^i1:([^:]+):(0|[1-9][0-9]{0,18})$/.exec(value);
  if (!match || match[0].length !== value.length || !validStream(match[1])) throw invalid();
  const seq = BigInt(match[2]); if (!validSeq(seq)) throw invalid();
  return { streamId: match[1], seq };
}
export function selectIngestCursor(header: unknown, query: unknown): string | undefined {
  if (header !== undefined) parseIngestCursor(header);
  if (query !== undefined) parseIngestCursor(query);
  if (header !== undefined && query !== undefined && header !== query) throw invalid();
  return (header ?? query) as string | undefined;
}
export type IngestLogPosition = { streamId: string; head: bigint; floor: bigint };
export function resolveIngestCursor(value: unknown, position: IngestLogPosition):
  { mode: 'replay'; after: bigint; cursor: string } | { mode: 'resync'; reason: 'retention'; after: bigint; cursor: string } {
  if (!validStream(position.streamId) || !validSeq(position.head) || !validSeq(position.floor) || position.floor > position.head) throw unavailable();
  const requested = value === undefined ? { streamId: position.streamId, seq: 0n } : parseIngestCursor(value);
  if (requested.streamId !== position.streamId) throw new AuthFault('INGEST_CURSOR_JOB_MISMATCH', 409, false);
  if (requested.seq > position.head) throw new AuthFault('INGEST_CURSOR_AHEAD', 409, false);
  if (requested.seq < position.floor) return { mode: 'resync', reason: 'retention', after: position.head, cursor: encodeIngestCursor(position.streamId, position.head) };
  return { mode: 'replay', after: requested.seq, cursor: encodeIngestCursor(position.streamId, requested.seq) };
}
