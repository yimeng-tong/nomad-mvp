import { isSuppressedChain, selectBranchCandidates } from './branch-rules.js';
import { extractPoiCandidates, fetchXhsPost, rehostMedia, standardizeCandidates } from './adapters.js';
import { appendIngestEvent, getJob, persistIngestOutput } from './store.js';
import { extractTimeEvidence } from './evidence.js';
import type { ExtractedCandidate, RehostedAsset, StandardizedCandidate, XhsFetchedPost } from './adapters.js';
import type { IngestWriteEvent } from './types.js';
import { fixtureAuth, runAsAcceptedJob } from '../auth/owner.js';
import { isXhsUrl } from './link-parser.js';
import { getPrisma } from '../db/prisma.js';
import { AuthFault } from '../auth/errors.js';

const runningJobs = new Set<string>();
export function assertIngestCapability() {
  // The existing extraction/geocoding/rehosting implementations are fixtures, not production providers.
  if (!fixtureAuth()) throw new AuthFault('INGEST_CAPABILITY_UNAVAILABLE',503,false);
}
export function startIngestPipeline(jobId: string) {
  if(getPrisma())return; // Durable DB jobs are dispatched exclusively by the lease worker.
  const job = getJob(jobId);
  if (!job || job.status !== 'created') return;
  const key = `${jobId}:${job.retryCount+1}`;
  if (runningJobs.has(key)) return;
  runningJobs.add(key);
  queueMicrotask(() => {
    void runAsAcceptedJob({ownerId:job.dbUserId,authVersion:job.authVersion ?? -1},()=>runIngestPipeline(jobId))
      .catch(() => undefined).finally(()=>runningJobs.delete(key));
  });
}
export async function runIngestPipeline(jobId: string) {
  const job = getJob(jobId); if (!job) return;
  const attempt = job.retryCount + 1;
  const emit = (event: IngestWriteEvent) => appendIngestEvent(jobId,event,attempt);
  let partial = false; let diagnostic: string | undefined;
  try {
    assertIngestCapability();
    if (!isXhsUrl(job.sourceUrl)) throw new AuthFault('INGEST_XHS_URL_REQUIRED',400,false);
    await emit({state:'fetching'});
    let post: XhsFetchedPost;
    try { post = await fetchXhsPost(job.sourceUrl); }
    catch { throw new AuthFault('INGEST_FETCH_FAILED',503,true); }
    if (!post.text.trim() && !post.media.length) throw new AuthFault('INGEST_CONTENT_UNAVAILABLE',422,false);
    await emit({state:'parsing',sub_stage:'multimodal',source_title:post.title,fetched_count:post.media.length});
    let extracted: ExtractedCandidate[] = [];
    let extractionKnown = true;
    try { extracted = await extractPoiCandidates(post); }
    catch { partial=true; extractionKnown=false; diagnostic='INGEST_EXTRACTION_DEGRADED'; }
    if (extracted.length) await emit({state:'geo',parsed_count:extracted.length});
    else if (extractionKnown) await emit({state:'parsing',parsed_count:0});
    let standardized: {highConfidence?:StandardizedCandidate;candidates:StandardizedCandidate[]} = {candidates:[]};
    try { if (extracted.length) standardized = await standardizeCandidates(extracted); }
    catch { partial=true; diagnostic='INGEST_GEO_DEGRADED'; }
    const highConfidence = !partial && standardized.highConfidence && !isSuppressedChain(standardized.highConfidence) ? standardized.highConfidence : undefined;
    const mainPoint = typeof highConfidence?.lat === 'number' && typeof highConfidence.lon === 'number' ? {lat:highConfidence.lat,lon:highConfidence.lon}:undefined;
    const candidates = selectBranchCandidates(standardized.candidates,mainPoint);
    await emit({state:'storing'});
    let assets: RehostedAsset[] = [];
    try { assets = await rehostMedia(post.media,job.sourceUrl); }
    catch { partial=true; diagnostic='INGEST_REHOST_DEGRADED'; }
    if (!post.text.trim() && !assets.length) throw new AuthFault('INGEST_NOT_SAVED',503,true);
    const result = await persistIngestOutput({job,post,assets,highConfidence:partial?undefined:highConfidence,candidates,timeEvidence:extractTimeEvidence(post,job.sourceUrl),partial});
    await emit({state:partial?'failed':'done',partial,retriable:partial,error_code:diagnostic,candidate_count:result.candidateCount,stored_count:1});
  } catch (error) {
    if (error instanceof AuthFault && ['INGEST_ATTEMPT_CHANGED','INGEST_STATE_CHANGED','AUTH_ACCOUNT_UNAVAILABLE','AUTH_CONTEXT_CHANGED'].includes(error.code)) return;
    await emit({state:'failed',error_code:error instanceof AuthFault && error.code.startsWith('INGEST_')?error.code:'INGEST_PIPELINE_FAILED',
      retriable:error instanceof AuthFault ? error.retriable : true});
  }
}
