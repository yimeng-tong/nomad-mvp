import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';

const ID = 'capacitor-2026-09-19';
// This is the explicit approval record, not a hash of mutable execution status.
const APPROVAL_HASH = '006bf38f4fb280fa0f2b65db94776b149b14a55fef74c9ac35cd92c7cb84ffe4';
const APPROVED_SNAPSHOT_HASH = '7de243b39258e2eb339e6f7617dac101f6c300c945490986ae0a78cf114d8464';
const sha = (text) => createHash('sha256').update(text).digest('hex');
const front = (text) => yaml.load(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1], { schema: yaml.JSON_SCHEMA });
export const APP_CONDITION_OWNERS = { 'APP-BUILD-01': '9.1', 'APP-HOST-01': '9.1', 'APP-DISTRIBUTE-01': '9.2' };
export const appGwt = (text) => text.split(/\r?\n\s*\r?\n/).filter((block) => block.startsWith('**Given**')).map((block) => block.trim());
const narrative = (text) => [...text.matchAll(/^(?:As a |I want |So that ).+$/gm)].map((m) => m[0]);
const requirements = (text) => text.match(/\*\*Requirements:\*\*[\s\S]*?(?=\n\n)/)?.[0];
export function storyBlocks(text) {
  const headings = [...text.matchAll(/^## Epic \d+:.*$|^### Story (\d+\.\d+):.*$/gm)];
  return Object.fromEntries(headings.filter((h) => h[1]).map((h) => {
    const next = headings[headings.indexOf(h) + 1];
    return [h[1], text.slice(h.index, next?.index ?? text.length)];
  }));
}

function amendedOriginal(id, text) {
  if (id === '1.0') return text
    .replace('旅行者 Web/PWA 或已有实际宿主', 'Web/PWA、Android Capacitor App 或 iOS Capacitor App')
    .replace('也不要求新建原生 App', 'App 工程与基础宿主由 Story 9.1 交付，本 Story 在三端核验实际身份、会话、适用第三方方式与返回路径，缺少任一支持端的必需证据不得关闭')
    .replace('腾讯行为验证只按', '已确认的 PNVS 图形认证只按')
    .replace('测试需含被拒绝的跨站及篡改回调路径', '测试需含被拒绝的跨站及篡改回调路径；WebView、系统认证会话和原生网络不能假定共享 cookie，API/SSE/下载同服从持久会话权威，本地宿主来源不得放宽远程 HTTPS、CORS 或 CSRF')
    .replace('账号合并、自助解绑、设备中心及 7.5 清理全流程不在本 Story 范围', '另提供 Android/iOS 实际安装候选的回调/恢复/退出/撤权/SSE/下载证据且网页回归通过，9.2 最终分发不是本 Story 前置；账号合并、自助解绑、设备中心及 7.5 清理全流程不在本 Story 范围');
  if (id === '5.5') return text.replace('目标桌面与移动浏览器、设备内存档位以及 WebP/JPEG 编码器', '目标桌面与移动浏览器、Android/iOS WebView 及系统保存/解码路径、设备内存档位以及 WebP/JPEG 编码器');
  if (id === '7.6') return text
    .replace('当前环境为 Web/PWA 或已存在的支持 WebView 的宿主', '当前环境为 Web/PWA 或本期 Android/iOS Capacitor App')
    .replace('不新增原生壳、不把 window.open 当 WebView', 'App 复用 9.1 的受限外链能力，外部页面不能持有 Nomad 原生桥接或会话，不把 window.open 当 WebView');
  return text;
}

export function checkScopeAmendment({ current, sprint, migration, epicsText, read, exists }) {
  if (migration.schema_version === 1) {
    assert.ok(!migration.scope_change && !current.scope_change && !sprint.scope_change, 'Scope amendment requires its versioned approved catalog');
    return null;
  }
  assert.equal(migration.schema_version, 2, 'Unsupported migration schema');
  const change = migration.scope_change;
  assert.equal(change?.id, ID, 'Unknown scope revision requires explicit approval and validation');
  assert.equal(current.scope_change, ID);
  assert.equal(sprint.scope_change, ID);
  const decisionText = read(change.decision);
  assert.equal(sha(decisionText), APPROVAL_HASH, 'The explicit scope approval record changed');
  assert.equal(change.decision_sha256, APPROVAL_HASH);
  const decision = front(decisionText);
  assert.equal(decision.status, 'approved');
  assert.equal(decision.continuous_execution_authorized, true);
  assert.equal(current.scope_decision, change.decision);
  assert.equal(sprint.scope_decision, change.decision);
  assert.equal(current.scope_readiness_report, change.readiness_report);
  assert.equal(sprint.revalidation_report, change.readiness_report);
  assert.equal(sha(read(change.baseline_migration)), change.baseline_migration_sha256, 'Original migration baseline changed');
  const baseline = yaml.load(read(change.baseline_migration), { schema: yaml.JSON_SCHEMA });
  assert.equal(baseline.schema_version, 1);
  assert.equal(change.snapshot_directory, decision.snapshot_directory);
  assert.equal(change.snapshot_manifest, `${change.snapshot_directory}/snapshot-manifest.json`);
  const snapshotText = read(change.snapshot_manifest);
  assert.equal(change.snapshot_manifest_sha256, APPROVED_SNAPSHOT_HASH, 'The approved input snapshot fingerprint cannot be regenerated');
  assert.equal(sha(snapshotText), APPROVED_SNAPSHOT_HASH, 'The approved input snapshot fingerprint changed');
  const snapshot = JSON.parse(snapshotText);
  for (const [file, entry] of Object.entries(snapshot.files)) {
    assert.equal(sha(read(`${change.snapshot_directory}/${file}`)), entry.sha256, `Pre-amendment historical snapshot changed: ${file}`);
  }
  const frozen = (file) => {
    assert.ok(snapshot.files[file], `Approved historical input absent from snapshot: ${file}`);
    return read(`${change.snapshot_directory}/${file}`);
  };
  assert.equal(read(change.baseline_migration), frozen(change.baseline_migration), 'Baseline migration cannot be rewritten with the amendment');
  for (const field of ['authorization', 'snapshot', 'legacy_story_mappings', 'retrospective_scope', 'paused_story_contract', 'deferred_story_ids', 'deferred_requirements']) {
    assert.deepEqual(migration[field], baseline[field], `Scope amendment must preserve historical ${field}`);
  }
  assert.deepEqual(migration.scope_counts, decision.scope_counts, 'Current counts must match the approved scope');
  const oldBlocks = storyBlocks(frozen(sprint.epics_source)), blocks = storyBlocks(epicsText);
  assert.deepEqual(Object.keys(blocks), [...Object.keys(oldBlocks), ...decision.new_story_ids], 'Scope amendment may add only the approved Story identities');
  const appendix = read(change.approved_appendix);
  assert.equal(appendix, frozen(decision.contracts_appendix), 'Use the approved frozen contract appendix');
  const additions = {};
  const extraHeads = [...appendix.matchAll(/^### (C\d+) — (\d+\.\d+)：[^\n]+\n/gm)];
  for (let i = 0; i < extraHeads.length; i++) {
    const h = extraHeads[i], end = extraHeads[i + 1]?.index ?? appendix.indexOf('## 增量责任与数量校验', h.index);
    const cases = appGwt(appendix.slice(h.index, end));
    assert.equal(cases.length, 1, `Approved scenario malformed: ${h[1]}`);
    (additions[h[2]] ??= []).push(...cases);
    assert.ok(blocks[h[2]].includes(`#### ${h[1]} —`), `Missing approved native scenario ${h[1]}`);
  }
  for (const [id, body] of Object.entries(oldBlocks)) {
    assert.deepEqual(appGwt(blocks[id]), [...appGwt(amendedOriginal(id, body)), ...(additions[id] ?? [])], `Approved source GWT obligations drifted: ${id}`);
    assert.deepEqual(narrative(blocks[id]), narrative(body), `Existing Story narrative drifted: ${id}`);
    assert.ok(blocks[id].includes(requirements(body)), `Existing Story Requirements lost: ${id}`);
  }
  for (const id of decision.new_story_ids) {
    const segment = appendix.split(`## Draft Story ${id}：`)[1].split('\n## ')[0];
    assert.deepEqual(appGwt(blocks[id]), appGwt(segment), `Approved new Story GWT drifted: ${id}`);
    assert.deepEqual(narrative(blocks[id]), narrative(segment));
    assert.ok(blocks[id].includes(requirements(segment)), `New Story Requirements drifted: ${id}`);
  }
  assert.equal(Object.values(blocks).reduce((n, body) => n + appGwt(body).length, 0), decision.scope_counts.gwt_scenarios);
  const byId = Object.fromEntries(Object.entries(migration.story_catalog).map(([k, v]) => [v.story_id, k]));
  assert.deepEqual(migration.preparation_order, [byId['9.1'], ...baseline.preparation_order, byId['9.2']], 'Keep the approved preparation order, independently of source numbering');
  const order = migration.preparation_order;
  assert.equal(new Set(order).size, order.length, 'Preparation order must be unique');
  assert.deepEqual(Object.keys(migration.dependencies).sort(), [...order].sort(), 'Every current Story needs a dependency disposition');
  for (const [key, dependencies] of Object.entries(migration.dependencies)) {
    assert.equal(new Set(dependencies).size, dependencies.length);
    for (const dependency of dependencies) assert.ok(order.includes(dependency) && order.indexOf(dependency) < order.indexOf(key), `Forward/cyclic dependency: ${key} -> ${dependency}`);
  }
  assert.deepEqual(migration.dependencies[byId['9.1']], [], 'Foundation must not depend on completed production auth');
  assert.deepEqual(migration.dependencies[byId['9.2']], order.filter((k) => k !== byId['9.2']).sort((a, b) => Object.keys(migration.story_catalog).indexOf(a) - Object.keys(migration.story_catalog).indexOf(b)), 'Final distribution must retain its approved business prerequisites');
  assert.deepEqual(migration.closure_dependencies, { [byId['1.0']]: [byId['9.1']] }, 'Native auth closure needs the host, without blocking independent backend work');
  for (const [key, dependencies] of Object.entries({ ...migration.dependencies, ...migration.closure_dependencies })) {
    if (['review', 'done'].includes(sprint.development_status[key])) assert.ok(dependencies.every((dep) => sprint.development_status[dep] === 'done'), `Cannot close ${key} before required delivery evidence`);
  }
  for (const packet of ['architecture', 'ux', 'supporting-tech-specs']) {
    const text = read(`_bmad-output/planning-artifacts/${packet}.md`);
    const markers = [...text.matchAll(/^## Source: `([^`]+)`\n/gm)];
    assert.ok(markers.length, `Source packet empty: ${packet}`);
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const content = text.slice(marker.index + marker[0].length, markers[i + 1]?.index ?? text.length).trim().replace(/\n\n---$/, '').trim();
      assert.equal(content, read(marker[1]).trim(), `Source packet drifted: ${marker[1]}`);
    }
  }
  assert.ok(exists(change.readiness_report));
  return { ...change, counts: decision.scope_counts, baseline, blocks, additions, frozen };
}

export function checkPreparedAppContract({ key, id, storyText, source, status, sprint, read, exists, nativeConditionBound }) {
  assert.deepEqual(appGwt(storyText), appGwt(source), `Prepared Story changed or omitted approved GWT: ${key}`);
  assert.deepEqual(narrative(storyText), narrative(source), `Prepared Story narrative mismatch: ${key}`);
  assert.ok(storyText.includes(requirements(source)), `Prepared Story Requirements mismatch: ${key}`);
  const tasks = storyText.split(/^## Tasks(?: \/ Subtasks)?\s*$/m)[1]?.split(/^## /m)[0];
  assert.ok(tasks, `Prepared Story needs actual Tasks: ${key}`);
  const requiresHost = nativeConditionBound || source.includes('APP-HOST-01');
  if (requiresHost) assert.ok(tasks.includes('APP-HOST-01'), `Native obligations must enter actual Tasks: ${key}`);
  if (!['review', 'done'].includes(status) || !requiresHost) return;
  const progress = sprint.condition_progress[key] ?? {};
  assert.equal(progress['APP-HOST-01']?.state, 'verified', `Native closure needs scoped APP-HOST-01 proof: ${key}`);
  const meta = front(storyText);
  assert.ok(meta.app_delivery_evidence && exists(meta.app_delivery_evidence), `Native closure needs actual evidence record: ${key}`);
  const evidence = yaml.load(read(meta.app_delivery_evidence), { schema: yaml.JSON_SCHEMA });
  assert.equal(evidence.kind, 'real-runtime', 'Configuration or fixture evidence cannot close App acceptance');
  assert.ok(evidence.source_revision && evidence.recorded_at);
  for (const platform of ['android', 'ios']) {
    const item = evidence.platforms?.[platform];
    assert.equal(item?.device_install_verified, true, `Missing actual ${platform} install evidence`);
    assert.ok(item.build_id && item.device && item.os && Array.isArray(item.evidence) && item.evidence.length && item.evidence.every(exists), `Incomplete ${platform} runtime evidence`);
  }
  if (id === '9.1' || id === '9.2') assert.equal(progress['APP-BUILD-01']?.state, 'verified');
  if (id === '9.2') {
    assert.equal(progress['APP-DISTRIBUTE-01']?.state, 'verified');
    assert.equal(evidence.platforms.android.distribution, 'signed-apk');
    assert.equal(evidence.platforms.ios.distribution, 'testflight');
    assert.equal(evidence.platforms.ios.test_group_install_verified, true, 'IPA or upload acceptance is not TestFlight availability');
    assert.ok(evidence.platforms.ios.expires_at);
  }
}
