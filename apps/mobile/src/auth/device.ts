const DEVICE_ID_KEY = 'nomad_device_fingerprint';
let memoryDeviceId: string | undefined;

function newDeviceId() {
  if (globalThis.crypto?.randomUUID) return `web_${globalThis.crypto.randomUUID()}`;
  return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function getDeviceFingerprint() {
  try {
    const existing = globalThis.localStorage?.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = newDeviceId();
    globalThis.localStorage?.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    memoryDeviceId ??= newDeviceId();
    return memoryDeviceId;
  }
}
