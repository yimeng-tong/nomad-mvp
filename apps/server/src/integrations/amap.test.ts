import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { searchAmapPoi } from './amap.js';

const previousKey = process.env.AMAP_WEB_SERVICE_KEY;
const previousFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.AMAP_WEB_SERVICE_KEY;
  else process.env.AMAP_WEB_SERVICE_KEY = previousKey;
});

describe('AMap POI normalization', () => {
  it('parses valid longitude,latitude locations and rejects malformed coordinates', async () => {
    process.env.AMAP_WEB_SERVICE_KEY = 'test-key';
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        status: '1',
        pois: [
          {
            id: 'valid',
            name: '有效地点',
            address: '厦门',
            distance: '120.4',
            location: '118.081234,24.479876',
          },
          {
            id: 'invalid',
            name: '坐标缺失地点',
            address: '厦门',
            distance: [],
            location: '999,not-a-number',
          },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const results = await searchAmapPoi('厦门', '地点', 2);
    assert.deepEqual(results[0], {
      poi_id: 'valid',
      name: '有效地点',
      address: '厦门',
      distance_m: 120,
      latitude: 24.479876,
      longitude: 118.081234,
    });
    assert.equal(results[1]!.latitude, null);
    assert.equal(results[1]!.longitude, null);
  });
});
