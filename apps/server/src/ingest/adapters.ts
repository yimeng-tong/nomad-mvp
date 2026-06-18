import { createHash } from 'node:crypto';
import type { BranchCandidateInput } from './branch-rules.js';

export type XhsFetchedPost = {
  title: string;
  text: string;
  media: Array<{
    url: string;
    kind: 'image' | 'video';
    width?: number;
    height?: number;
    format?: string;
  }>;
};

export type ExtractedCandidate = {
  name: string;
  authorClue?: string;
  evidenceSource: string;
  confidence: number;
};

export type RehostedAsset = {
  kind: string;
  cosKey: string;
  sha256?: string;
  width?: number;
  height?: number;
  format?: string;
};

export type StandardizedCandidate = BranchCandidateInput & {
  cityName?: string;
};

function validateFetchedPost(value: unknown): XhsFetchedPost {
  if (!value || typeof value !== 'object') throw new Error('XHS_DOWNLOADER_BAD_PAYLOAD');
  const body = value as Partial<XhsFetchedPost>;
  if (!Array.isArray(body.media)) throw new Error('XHS_DOWNLOADER_BAD_PAYLOAD');
  for (const asset of body.media) {
    if (!asset || typeof asset.url !== 'string' || (asset.kind !== 'image' && asset.kind !== 'video')) {
      throw new Error('XHS_DOWNLOADER_BAD_PAYLOAD');
    }
  }
  return {
    title: typeof body.title === 'string' ? body.title : '小红书灵感',
    text: typeof body.text === 'string' ? body.text : '',
    media: body.media,
  };
}

function shouldFailStub(stage: string) {
  return (process.env.INGEST_STUB_FAIL_STAGE ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(stage);
}

export async function fetchXhsPost(url: string): Promise<XhsFetchedPost> {
  if (shouldFailStub('fetch')) throw new Error('stub fetch failed');

  if (process.env.XHS_DOWNLOADER_URL) {
    const response = await fetch(process.env.XHS_DOWNLOADER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error(`XHS_DOWNLOADER_${response.status}`);
    return validateFetchedPost(await response.json());
  }

  return {
    title: '杭州灵感',
    text: '作者推荐西湖边散步，适合傍晚拍照。',
    media: [
      {
        url: `${url}#media-1`,
        kind: 'image',
        width: 1080,
        height: 1440,
        format: 'jpg',
      },
    ],
  };
}

export async function rehostMedia(media: XhsFetchedPost['media'], sourceUrl: string): Promise<RehostedAsset[]> {
  if (shouldFailStub('rehost')) throw new Error('stub rehost failed');

  return media.map((asset, index) => {
    const digest = createHash('sha256').update(`${sourceUrl}:${asset.url}:${index}`).digest('hex');
    return {
      kind: asset.kind,
      cosKey: `ingest/xhs/${digest.slice(0, 24)}.${asset.format || 'jpg'}`,
      sha256: digest,
      width: asset.width,
      height: asset.height,
      format: asset.format,
    };
  });
}

export async function extractPoiCandidates(post: XhsFetchedPost): Promise<ExtractedCandidate[]> {
  if (shouldFailStub('extract')) throw new Error('stub extraction failed');

  const candidateName = post.text.includes('西湖') || post.title.includes('杭州') ? '西湖' : post.title || '小红书地点';
  return [
    {
      name: candidateName,
      authorClue: '作者评价线索：适合散步和拍照',
      evidenceSource: 'xhs_stub_multimodal',
      confidence: 0.72,
    },
  ];
}

export async function standardizeCandidates(candidates: ExtractedCandidate[]): Promise<{
  highConfidence?: StandardizedCandidate;
  candidates: StandardizedCandidate[];
}> {
  if (shouldFailStub('geo')) throw new Error('stub geocoding failed');

  const standardized = candidates.map<StandardizedCandidate>((candidate, index) => ({
    name: candidate.name,
    address: index === 0 ? '杭州市西湖区' : '待确认地址',
    amapId: `stub_${createHash('sha1').update(candidate.name).digest('hex').slice(0, 10)}`,
    lat: 30.259,
    lon: 120.13,
    distanceMeters: index * 120,
    confidence: candidate.confidence,
    cityName: '杭州',
  }));

  if (process.env.AMAP_STUB_HIGH_CONFIDENCE === 'true') {
    return { highConfidence: standardized[0], candidates: standardized };
  }

  return { candidates: standardized };
}
