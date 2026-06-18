export type IngestStage = 'created' | 'fetching' | 'parsing' | 'geo' | 'storing' | 'done' | 'failed';
export type ParsingSubStage = 'text' | 'ocr' | 'vision';

export type IngestWarning = {
  code: 'INGEST_SINGLE_LINK_ONLY';
  message: string;
  extra_count: number;
};

export type IngestEvent = {
  trace_id: string;
  ingest_id: string;
  state: IngestStage;
  sub_stage?: ParsingSubStage;
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

export type IngestJobRecord = {
  id: string;
  dbId: string;
  userId: string;
  dbUserId: string;
  sourceUrl: string;
  sourceHash: string;
  status: IngestStage;
  traceId: string;
  retryCount: number;
  warning?: IngestWarning;
  events: IngestEvent[];
};

export type IngestStartResult = {
  ingest_id: string;
  state: 'created';
  sse_url: string;
  warning?: IngestWarning;
};

export type StoredInspirationResult = {
  inspirationId: string;
  locateStatus: 'resolved' | 'pending';
  candidateCount: number;
  assetCount: number;
};
