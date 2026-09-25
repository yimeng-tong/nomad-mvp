import assert from 'node:assert/strict';

export function alignAppSpmMinimum(source) {
  const declarations = [...source.matchAll(/platforms:\s*\[\.iOS\(([^)]+)\)\]/g)];
  assert.equal(declarations.length, 1, 'App SPM must have one explicit iOS platform declaration');
  assert.ok(['.v16', '"16.0"', '"16.4"'].includes(declarations[0][1]), 'Unexpected App SPM minimum requires an explicit compatibility decision');
  return source.replace(declarations[0][0], 'platforms: [.iOS("16.4")]');
}

/** Every current project configuration must agree; one matching target is insufficient. */
export function assertNativePlatformTargets({ project, spm, webTargets, cssTargets }) {
  const deployments = [...project.matchAll(/"?IPHONEOS_DEPLOYMENT_TARGET(?:\[[^\]\r\n]+\])*"?\s*=\s*([^;]+);/g)].map((m) => m[1].trim().replaceAll('"', ''));
  assert.ok(deployments.length >= 4, 'All project and App deployment configurations must be explicit');
  assert.ok(deployments.every((target) => target === '16.4'), 'Every iOS deployment target must be 16.4');
  assert.match(spm, /platforms:\s*\[\.iOS\("16\.4"\)\]/, 'App SPM minimum must be 16.4');
  const expected = ['chrome111', 'edge111', 'firefox128', 'safari16.4', 'ios16.4'];
  assert.deepEqual(webTargets, expected, 'Web JS targets must match the approved support matrix');
  assert.deepEqual(cssTargets, expected, 'Web CSS targets must match the approved support matrix');
}

/** Configuration identity is broader than appId/API: security and compatibility travel together. */
export function assertNativeConfigMatches(generated, expected, platform) {
  const managed = platform === 'ios' ? ['packageClassList'] : [];
  for (const key of Object.keys(generated)) assert.ok(Object.hasOwn(expected, key) || managed.includes(key), `Unexpected generated ${platform} configuration: ${key}`);
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(generated[key], value, `Generated ${platform} configuration drifted: ${key}`);
  if (platform === 'ios') assert.ok(Array.isArray(generated.packageClassList) && generated.packageClassList.every((name) => typeof name === 'string'), 'iOS plugin class registration missing');
}
