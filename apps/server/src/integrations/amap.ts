export type AmapPoiSearchItem = {
  poi_id: string;
  name: string;
  address: string;
  distance_m: number | null;
};

type AmapPoi = {
  id?: unknown;
  name?: unknown;
  address?: unknown;
  distance?: unknown;
};

type AmapPoiResponse = {
  status?: unknown;
  info?: unknown;
  pois?: unknown;
};

export class AmapSearchUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmapSearchUnavailableError';
  }
}

function text(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join(' ').trim();
  return '';
}

function distance(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export async function searchAmapPoi(city: string, query: string, topk: number): Promise<AmapPoiSearchItem[]> {
  const apiKey = process.env.AMAP_WEB_SERVICE_KEY?.trim();
  if (!apiKey) throw new AmapSearchUnavailableError('AMap Web Service key is not configured');

  const endpoint = process.env.AMAP_POI_SEARCH_URL?.trim() || 'https://restapi.amap.com/v3/place/text';
  const url = new URL(endpoint);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('keywords', query);
  url.searchParams.set('city', city);
  url.searchParams.set('citylimit', 'true');
  url.searchParams.set('offset', String(topk));
  url.searchParams.set('page', '1');
  url.searchParams.set('extensions', 'base');

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
  } catch {
    throw new AmapSearchUnavailableError('AMap POI search request failed');
  }

  if (!response.ok) throw new AmapSearchUnavailableError(`AMap POI search returned HTTP ${response.status}`);

  let body: AmapPoiResponse;
  try {
    body = (await response.json()) as AmapPoiResponse;
  } catch {
    throw new AmapSearchUnavailableError('AMap POI search returned invalid JSON');
  }

  if (body.status !== '1' || !Array.isArray(body.pois)) {
    throw new AmapSearchUnavailableError(`AMap POI search failed: ${text(body.info) || 'unknown error'}`);
  }

  return (body.pois as AmapPoi[])
    .map((poi) => ({
      poi_id: text(poi.id),
      name: text(poi.name),
      address: text(poi.address),
      distance_m: distance(poi.distance),
    }))
    .filter((poi) => poi.poi_id && poi.name && poi.address)
    .slice(0, topk);
}
