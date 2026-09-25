import type { IngestSnapshot, IngestResult } from './job-state.js';
export type IngestStage = 'created' | 'fetching' | 'parsing' | 'geo' | 'storing' | 'done' | 'failed';
export const parsingSubStages = ['media_prep', 'speech_detect', 'frame_extract', 'asr', 'multimodal'] as const;
export type ParsingSubStage = typeof parsingSubStages[number];
export type LegacyParsingSubStage = 'text' | 'ocr' | 'vision';

export type IngestWarning = {
  code: 'INGEST_SINGLE_LINK_ONLY';
  message: string;
  extra_count: number;
};

export type IngestEvent = {
  attempt?: number;
  state_version?: number;
  snapshot?: IngestSnapshot;
  source_title?: string;
  partial?: boolean;
  result?: IngestResult;
  trace_id: string;
  ingest_id: string;
  state: IngestStage;
  sub_stage?: ParsingSubStage | LegacyParsingSubStage | null;
  retry?: number;
  fetched_count?: number;
  parsed_count?: number;
  candidate_count?: number;
  stored_count?: number;
  error_code?: string;
  error_message?: string;
  retriable?: boolean;
  ts: number;
};

export type IngestWriteEvent = Omit<IngestEvent, 'ingest_id' | 'trace_id' | 'ts' | 'sub_stage' | 'snapshot' | 'attempt' | 'state_version'> & { sub_stage?: ParsingSubStage; ts?: number };

export type IngestJobRecord = {
  id: string;
  dbId: string;
  userId: string;
  dbUserId: string;
  authVersion?: number;
  sourceUrl: string;
  sourceHash: string;
  status: IngestStage;
  traceId: string;
  retryCount: number;
  snapshot?: IngestSnapshot;
  legacySnapshot?: boolean;
  warning?: IngestWarning;
  events: IngestEvent[];
};

export type IngestStartResult = {
  ingest_id: string;
  state: IngestStage;
  operation_id?: string;
  disposition?: 'created' | 'reused' | 'retried';
  snapshot?: IngestSnapshot;
  sse_url: string;
  warning?: IngestWarning;
};

export type StoredInspirationResult = {
  inspirationId: string;
  locateStatus: 'resolved' | 'pending';
  candidateCount: number;
  assetCount: number;
  cityName?: string | null;
};
