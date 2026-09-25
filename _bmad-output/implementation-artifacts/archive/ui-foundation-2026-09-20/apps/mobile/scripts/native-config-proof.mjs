import assert from 'node:assert/strict';

/** Configuration identity is broader than appId/API: security and compatibility travel together. */
export function assertNativeConfigMatches(generated, expected, platform) {
  const managed = platform === 'ios' ? ['packageClassList'] : [];
  for (const key of Object.keys(generated)) assert.ok(Object.hasOwn(expected, key) || managed.includes(key), `Unexpected generated ${platform} configuration: ${key}`);
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(generated[key], value, `Generated ${platform} configuration drifted: ${key}`);
  if (platform === 'ios') assert.ok(Array.isArray(generated.packageClassList) && generated.packageClassList.every((name) => typeof name === 'string'), 'iOS plugin class registration missing');
}
