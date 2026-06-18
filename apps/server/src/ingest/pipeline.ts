import { isSuppressedChain, selectBranchCandidates } from './branch-rules.js';
import { extractPoiCandidates, fetchXhsPost, rehostMedia, standardizeCandidates } from './adapters.js';
import { appendIngestEvent, getJob, persistIngestOutput } from './store.js';
import type { ExtractedCandidate, RehostedAsset, StandardizedCandidate, XhsFetchedPost } from './adapters.js';

const runningJobs = new Set<string>();

export function startIngestPipeline(jobId: string) {
  const job = getJob(jobId);
  if (!job || job.status === 'done' || job.status === 'failed' || runningJobs.has(jobId)) return;
  runningJobs.add(jobId);
  queueMicrotask(() => {
    void runIngestPipeline(jobId)
      .catch((error) => {
        void appendIngestEvent(jobId, {
          state: 'failed',
          error_code: 'INGEST_PIPELINE_UNHANDLED',
          error_message: errorMessage(error),
          retriable: true,
        }).catch(() => undefined);
      })
      .finally(() => runningJobs.delete(jobId));
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'ingest adapter failed';
}

async function appendDegradedFailure(jobId: string, errorCode: string, error: unknown) {
  await appendIngestEvent(jobId, {
    state: 'failed',
    error_code: errorCode,
    error_message: errorMessage(error),
    retriable: true,
  });
}

function fallbackPost(sourceUrl: string): XhsFetchedPost {
  return {
    title: '小红书灵感',
    text: '外部解析暂不可用，已保存为待定位灵感。',
    media: [
      {
        url: `${sourceUrl}#degraded-media`,
        kind: 'image',
        format: 'jpg',
      },
    ],
  };
}

export async function runIngestPipeline(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  let degraded = false;

  try {
    await appendIngestEvent(jobId, { state: 'fetching' });
    let post: XhsFetchedPost;
    try {
      post = await fetchXhsPost(job.sourceUrl);
    } catch (error) {
      degraded = true;
      await appendDegradedFailure(jobId, 'INGEST_XHS_FETCH_DEGRADED', error);
      post = fallbackPost(job.sourceUrl);
    }

    await appendIngestEvent(jobId, { state: 'parsing', sub_stage: 'text', fetched_count: post.media.length });
    await appendIngestEvent(jobId, { state: 'parsing', sub_stage: 'ocr', fetched_count: post.media.length });
    await appendIngestEvent(jobId, { state: 'parsing', sub_stage: 'vision', fetched_count: post.media.length });
    let extracted: ExtractedCandidate[] = [];
    try {
      extracted = await extractPoiCandidates(post);
    } catch (error) {
      degraded = true;
      await appendDegradedFailure(jobId, 'INGEST_EXTRACTION_DEGRADED', error);
    }

    await appendIngestEvent(jobId, { state: 'geo', parsed_count: extracted.length });
    let standardized: { highConfidence?: StandardizedCandidate; candidates: StandardizedCandidate[] } = { candidates: [] };
    try {
      standardized = await standardizeCandidates(extracted);
    } catch (error) {
      degraded = true;
      await appendDegradedFailure(jobId, 'INGEST_GEO_DEGRADED', error);
    }
    const highConfidence =
      !degraded && standardized.highConfidence && !isSuppressedChain(standardized.highConfidence)
        ? standardized.highConfidence
        : undefined;
    const mainPoint =
      typeof highConfidence?.lat === 'number' && typeof highConfidence.lon === 'number'
        ? { lat: highConfidence.lat, lon: highConfidence.lon }
        : undefined;
    const branchCandidates = selectBranchCandidates(standardized.candidates, mainPoint);

    await appendIngestEvent(jobId, { state: 'storing', candidate_count: branchCandidates.length });
    let assets: RehostedAsset[] = [];
    try {
      assets = await rehostMedia(post.media, job.sourceUrl);
    } catch (error) {
      degraded = true;
      await appendDegradedFailure(jobId, 'INGEST_REHOST_DEGRADED', error);
    }
    const stored = await persistIngestOutput({
      job,
      post,
      assets,
      highConfidence: degraded ? undefined : highConfidence,
      candidates: branchCandidates,
    });

    await appendIngestEvent(jobId, {
      state: 'done',
      candidate_count: stored.candidateCount,
      stored_count: 1,
    });
  } catch (error) {
    await appendIngestEvent(jobId, {
      state: 'failed',
      error_code: 'INGEST_PIPELINE_FAILED',
      error_message: error instanceof Error ? error.message : 'ingest failed',
      retriable: true,
    });
  }
}
