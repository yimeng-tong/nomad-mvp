import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDeviceFingerprint } from './device';

describe('getDeviceFingerprint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps a stable in-memory fingerprint when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(getDeviceFingerprint()).toBe(getDeviceFingerprint());
  });
});
