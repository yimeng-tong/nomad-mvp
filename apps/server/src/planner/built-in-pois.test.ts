import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUILT_IN_POI_DATA_VERSION,
  BUILT_IN_POI_NAMES,
  getBuiltInPoiManifest,
} from './built-in-pois.js';

describe('versioned built-in POI data', () => {
  it('keeps a stable, unique Xiamen Top-50 allowlist', () => {
    assert.match(BUILT_IN_POI_DATA_VERSION, /^xiamen-top50-\d{4}-\d{2}-\d{2}-v\d+$/);
    assert.equal(BUILT_IN_POI_NAMES.厦门.length, 50);
    assert.equal(new Set(BUILT_IN_POI_NAMES.厦门).size, 50);
    const manifest = getBuiltInPoiManifest('厦门');
    assert.equal(manifest.length, 50);
    assert.deepEqual(manifest.map((entry) => entry.rank), Array.from({ length: 50 }, (_, index) => index));
    assert.ok(manifest.every((entry) => entry.dataVersion === BUILT_IN_POI_DATA_VERSION));
  });
});
