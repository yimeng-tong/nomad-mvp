export type GeoPoint = {
  lat: number;
  lon: number;
};

export type BranchCandidateInput = Partial<GeoPoint> & {
  name: string;
  address?: string;
  amapId?: string;
  distanceMeters?: number;
  confidence?: number;
};

export type RankedBranchCandidate = {
  rank: number;
  name: string;
  address?: string;
  amapId?: string;
  lat?: number;
  lon?: number;
  distanceMeters?: number;
};

const earthRadiusMeters = 6371000;
const defaultSuppressedChains = ['星巴克', '麦当劳', '肯德基', 'KFC', '瑞幸', '喜茶', '奈雪'];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: GeoPoint, b: GeoPoint) {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

function withDistance(candidate: BranchCandidateInput, main?: GeoPoint) {
  if (typeof candidate.distanceMeters === 'number') return candidate.distanceMeters;
  if (main && typeof candidate.lat === 'number' && typeof candidate.lon === 'number') {
    return distanceMeters(main, { lat: candidate.lat, lon: candidate.lon });
  }
  return undefined;
}

function suppressedChains() {
  const configured = process.env.INGEST_CHAIN_SUPPRESSION_LIST?.split(',').map((item) => item.trim()).filter(Boolean);
  return configured?.length ? configured : defaultSuppressedChains;
}

function isSuppressedChain(candidate: BranchCandidateInput) {
  const name = candidate.name.toLowerCase();
  return suppressedChains().some((chain) => name.includes(chain.toLowerCase()));
}

export function selectBranchCandidates(candidates: BranchCandidateInput[], main?: GeoPoint) {
  return candidates
    .slice(0, 20)
    .filter((candidate) => !isSuppressedChain(candidate))
    .map((candidate) => ({ ...candidate, distanceMeters: withDistance(candidate, main) }))
    .filter((candidate) => candidate.distanceMeters === undefined || candidate.distanceMeters <= 2000)
    .sort((a, b) => {
      const distanceA = a.distanceMeters ?? Number.MAX_SAFE_INTEGER;
      const distanceB = b.distanceMeters ?? Number.MAX_SAFE_INTEGER;
      if (distanceA !== distanceB) return distanceA - distanceB;
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    })
    .slice(0, 5)
    .map<RankedBranchCandidate>((candidate, index) => ({
      rank: index + 1,
      name: candidate.name,
      address: candidate.address,
      amapId: candidate.amapId,
      lat: candidate.lat,
      lon: candidate.lon,
      distanceMeters: candidate.distanceMeters,
    }));
}
