import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';
import { checkScopeAmendment, storyBlocks, appGwt } from './check-capacitor-scope.mjs';
import { UI_SCOPE_ID, UI_CONDITION_OWNERS, UI_CONDITION_SOURCE, UI_NEW_IDS, amendedUiBlocks, uiPreparationOrder, uiConditionBindings } from './ui-scope-policy.mjs';

const APPROVAL_HASH = 'd6368fd03b443fc2308a0517f679c2da075eac66939d33243e9ae9fc0bbfba0b';
const SNAPSHOT_HASH = 'a06497838947b64a07926efc85fd14d0383a1db426ab44c85b125a9ae85deb2f';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const load = (text) => yaml.load(text, { schema: yaml.JSON_SCHEMA });
const front = (text) => load(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
const sameSet = (a, b, message) => assert.deepEqual([...a].sort(), [...b].sort(), message);

export function checkUiScopeAmendment({ current, sprint, migration, epicsText, read, exists }) {
  assert.equal(migration.schema_version, 3);
  const change = migration.scope_change;
  assert.equal(change?.id, UI_SCOPE_ID, 'Unknown UI scope requires approved versioned inputs');
  assert.equal(current.scope_change, UI_SCOPE_ID);
  assert.equal(sprint.scope_change, UI_SCOPE_ID);
  assert.equal(hash(read(change.decision)), APPROVAL_HASH, 'UI explicit approval record changed');
  assert.equal(change.decision_sha256, APPROVAL_HASH);
  const decision = front(read(change.decision));
  assert.equal(decision.status, 'approved');
  assert.equal(decision.resumes_stopped_execution, false);
  assert.deepEqual(decision.new_story_ids, UI_NEW_IDS);
  for (const pair of [[current.scope_decision, change.decision], [sprint.scope_decision, change.decision], [current.scope_readiness_report, change.readiness_report], [sprint.revalidation_report, change.readiness_report]]) assert.equal(...pair);
  assert.equal(change.snapshot_directory, decision.snapshot_directory);
  assert.equal(change.snapshot_manifest, change.snapshot_directory + '/snapshot-manifest.json');
  assert.equal(change.snapshot_manifest_sha256, SNAPSHOT_HASH, 'UI approved snapshot fingerprint cannot be regenerated');
  assert.equal(hash(read(change.snapshot_manifest)), SNAPSHOT_HASH, 'UI approved snapshot fingerprint changed');
  const snapshot = JSON.parse(read(change.snapshot_manifest));
  for (const [name, entry] of Object.entries(snapshot.files)) assert.equal(hash(read(change.snapshot_directory + '/' + name)), entry.sha256, 'UI input snapshot changed: ' + name);
  // The sealed packets also contain complete sources not copied as standalone snapshot files.
  // Do not re-read those historical inputs from a later live checkout.
  const packetSources = {};
  for (const packet of ['architecture', 'ux', 'supporting-tech-specs']) {
    const text = read(change.snapshot_directory + '/_bmad-output/planning-artifacts/' + packet + '.md');
    const markers = [...text.matchAll(/^## Source: \x60([^\x60]+)\x60\n/gm)];
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const body = text.slice(marker.index + marker[0].length, markers[i + 1]?.index ?? text.length).trim().replace(/\n\n---$/, '').trim();
      if (packetSources[marker[1]]) assert.equal(packetSources[marker[1]], body, 'Historical source packets disagree');
      packetSources[marker[1]] = body;
    }
  }
  const before = (name) => snapshot.files[name] ? read(change.snapshot_directory + '/' + name) : (packetSources[name] ?? read(name));
  const previousSprint = load(before('_bmad-output/implementation-artifacts/sprint-status.yaml'));
  const previousCurrent = front(before('CURRENT.md'));
  assert.equal(change.baseline_migration, previousSprint.migration_manifest);
  assert.equal(read(change.baseline_migration), before(change.baseline_migration), 'UI amendment cannot rewrite the previous catalog');
  assert.equal(read(previousSprint.delivery_contract), before(previousSprint.delivery_contract), 'UI amendment cannot rewrite the previous delivery contract');
  assert.equal(hash(read(change.baseline_migration)), change.baseline_migration_sha256);
  const previousMigration = load(before(change.baseline_migration));
  // Revalidate the prior approval against its own frozen source packet.
  const prior = checkScopeAmendment({ current: previousCurrent, sprint: previousSprint, migration: previousMigration, epicsText: before(previousSprint.epics_source), read: before, exists });
  assert.equal(prior.id, decision.baseline_scope_revision);
  assert.equal(read(change.approved_appendix), before(decision.contracts_appendix), 'UI must consume its frozen approved appendix');
  assert.equal(hash(read(change.approved_appendix)), decision.contracts_appendix_sha256);
  assert.equal(hash(before(decision.proposal)), decision.proposal_sha256);
  for (const field of ['authorization', 'snapshot', 'legacy_story_mappings', 'retrospective_scope', 'paused_story_contract', 'deferred_story_ids', 'deferred_requirements']) assert.deepEqual(migration[field], previousMigration[field], 'UI amendment must preserve historical ' + field);
  assert.deepEqual(migration.scope_counts, decision.scope_counts);
  const historicalIds = Object.values(previousMigration.story_catalog).filter((s) => s.scope === 'historical').map((s) => s.story_id);
  const expected = amendedUiBlocks(before(previousSprint.epics_source), read(change.approved_appendix), decision, historicalIds);
  const blocks = storyBlocks(epicsText);
  assert.deepEqual(Object.keys(blocks), Object.keys(expected.blocks), 'UI source may contain only approved Story identities');
  for (const [id, body] of Object.entries(expected.blocks)) assert.equal(blocks[id]?.trimEnd(), body.trimEnd(), 'UI approved source contract drifted: ' + id);
  assert.equal(Object.values(blocks).reduce((n, body) => n + appGwt(body).length, 0), 1089);
  const byId = Object.fromEntries(Object.entries(migration.story_catalog).map(([key, value]) => [value.story_id, key]));
  const order = uiPreparationOrder(previousMigration.preparation_order, byId);
  assert.deepEqual(migration.preparation_order, order, 'Keep the approved UI preparation order');
  sameSet(Object.keys(migration.dependencies), order, 'Every UI-scope target needs dependency disposition');
  const deps = structuredClone(previousMigration.dependencies);
  for (const id of UI_NEW_IDS) deps[byId[id]] = [];
  deps[byId['9.5']] = [byId['9.4']];
  deps[byId['9.3']] = [byId['9.4'], byId['9.5']];
  deps[byId['9.6']] = [byId['9.4'], byId['9.5']];
  deps[byId['9.7']] = [byId['9.4'], byId['9.5']];
  deps[byId['9.2']] = Object.keys(migration.story_catalog).filter((key) => order.includes(key) && key !== byId['9.2']);
  assert.deepEqual(migration.dependencies, deps, 'UI dependencies cannot lose approved predecessors');
  assert.deepEqual(migration.closure_dependencies, previousMigration.closure_dependencies, 'Keep native authentication closure gates');
  assert.deepEqual(migration.local_slice_dependencies, {
    [byId['9.6']]: { story_key: byId['9.3'], evidence_gate: 'shared-ui-local-regression-passed' },
    [byId['9.7']]: { story_key: byId['9.3'], evidence_gate: 'shared-ui-local-regression-passed' },
  }, 'Query and Router need stable local UI without substituting whole native closure');
  for (const [key, dep] of Object.entries(deps)) {
    for (const parent of dep) assert.ok(order.indexOf(parent) >= 0 && order.indexOf(parent) < order.indexOf(key), 'UI forward/cyclic dependency: ' + key);
    if (['review', 'done'].includes(sprint.development_status[key])) assert.ok(dep.every((parent) => sprint.development_status[parent] === 'done'), 'Cannot close ' + key + ' before required delivery evidence');
    if (UI_NEW_IDS.some((id) => byId[id] === key) && sprint.development_status[key] === 'in-progress') {
      assert.ok(dep.every((parent) => sprint.development_status[parent] === 'done'), 'UI development requires its delivered workbench/browser prerequisites');
    }
  }
  for (const [key, dep] of Object.entries(migration.closure_dependencies)) if (['review', 'done'].includes(sprint.development_status[key])) assert.ok(dep.every((parent) => sprint.development_status[parent] === 'done'), 'Cannot close ' + key + ' before required delivery evidence');
  const targets = Object.values(migration.story_catalog).filter((s) => s.scope === 'current-target').map((s) => s.story_id);
  const bindings = uiConditionBindings(targets, decision.ui_consumer_story_ids);
  for (const [id, required] of Object.entries(bindings)) {
    const old = previousMigration.story_condition_bindings[byId[id]] ?? [];
    const native = ['9.3', '9.6', '9.7'].includes(id) ? ['APP-HOST-01'] : [];
    sameSet(migration.story_condition_bindings[byId[id]], [...old, ...native, ...required], 'UI condition binding drifted: ' + id);
  }
  for (const id of Object.keys(UI_CONDITION_OWNERS)) sameSet(migration.implementation_conditions[id].applies_to, targets.filter((story) => bindings[story].includes(id)).map((story) => byId[story]), 'UI condition applicability drifted: ' + id);
  checkExecutionBoundary({ current, sprint, previousSprint, decision, order, read, exists });
  for (const [key, gate] of Object.entries(migration.local_slice_dependencies)) {
    if (!['in-progress', 'review', 'done'].includes(sprint.development_status[key])) continue;
    const progress = sprint.scope_local_slice_progress?.[gate.story_key]?.[gate.evidence_gate];
    assert.ok(['in-progress', 'review', 'done'].includes(sprint.development_status[gate.story_key]), 'Local UI foundation must actually be implemented before Query/Router');
    assert.equal(progress?.state, 'verified', 'Query/Router cannot start before the stable local UI slice');
    assert.ok(progress.evidence && exists(progress.evidence), 'Local UI slice needs actual evidence');
    const proof = load(read(progress.evidence));
    assert.equal(proof.kind, 'local-ui-regression');
    assert.equal(proof.result, 'passed', 'Failed local UI regression cannot unlock Query/Router');
    assert.equal(proof.story_id, '9.3');
    assert.equal(proof.source_contract_sha256, migration.story_catalog[gate.story_key].contract_sha256);
    assert.ok(proof.source_revision && proof.recorded_at && proof.evidence?.length && proof.evidence.every(exists));
    assert.ok(Array.isArray(proof.checks) && proof.checks.length && proof.checks.every((check) => check.result === 'passed'), 'All required local UI checks must pass');
  }
  for (const packet of ['architecture', 'ux', 'supporting-tech-specs']) {
    const text = read('_bmad-output/planning-artifacts/' + packet + '.md');
    const markers = [...text.matchAll(/^## Source: \x60([^\x60]+)\x60\n/gm)];
    assert.ok(markers.length);
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const body = text.slice(marker.index + marker[0].length, markers[i + 1]?.index ?? text.length).trim().replace(/\n\n---$/, '').trim();
      assert.equal(body, read(marker[1]).trim(), 'Source packet drifted: ' + marker[1]);
    }
  }
  assert.ok(exists(change.readiness_report));
  return {
    ...change, counts: decision.scope_counts, baseline: prior.baseline, frozen: prior.frozen,
    blocks, additions: { ...prior.additions, ...expected.additions },
    conditionOwners: UI_CONDITION_OWNERS, conditionSource: UI_CONDITION_SOURCE,
    additionalObligations: { 'shared-ui-adoption': decision.ui_consumer_story_ids, 'ui-quality-tooling': ['9.4', '9.5'], 'identity-scoped-read-adoption': ['9.6'], 'typed-navigation-adoption': ['9.7'] },
    readinessScope: 'ui-foundation-planning-readiness',
  };
}

function checkExecutionBoundary({ current, sprint, previousSprint, decision, order, read, exists }) {
  assert.equal(current.stop_after_story, sprint.stop_after_story, 'Execution stop boundary must agree');
  if (current.stop_after_story !== decision.stop_after_story) {
    const path = sprint.execution_boundary_override;
    assert.ok(path && exists(path), 'Changing the stop boundary requires a recorded later user direction');
    const override = front(read(path));
    assert.equal(override.status, 'approved');
    assert.equal(override.action, 'resume-execution');
    assert.equal(override.supersedes_stop_after_story, decision.stop_after_story);
    assert.equal(override.scope_revision, UI_SCOPE_ID);
    assert.ok(override.user_request && override.recorded_at, 'Record the actual later user request; files do not grant authority');
    assert.ok(Object.hasOwn(override, 'stop_after_story'), 'Resumption must explicitly state its new stopping point');
    assert.equal(current.stop_after_story, override.stop_after_story, 'Resumption stopping point must match live state');
    assert.ok(override.stop_after_story === null || order.includes(override.stop_after_story), 'Unknown resumption stopping point');
    const allowed = override.allowed_story_keys;
    assert.ok(Array.isArray(allowed) && allowed.length && new Set(allowed).size === allowed.length, 'Resumption must explicitly identify its authorized execution window');
    const window = override.stop_after_story === null ? order : order.slice(0, order.indexOf(override.stop_after_story) + 1);
    assert.ok(allowed.every((key) => window.includes(key)), 'Resumption cannot allow development beyond its new stopping point');
    for (const [key, state] of Object.entries(sprint.development_status)) {
      if (!/^\d+-\d+-/.test(key) || ['in-progress', 'review', 'done'].includes(previousSprint.development_status[key])) continue;
      if (['in-progress', 'review', 'done'].includes(state)) assert.ok(allowed.includes(key), 'Development is outside the recorded resumption window: ' + key);
    }
    if (current.current_story && !['in-progress', 'review', 'done'].includes(previousSprint.development_status[current.current_story])) assert.ok(allowed.includes(current.current_story), 'CURRENT is outside the recorded resumption window');
    return;
  }
  assert.equal(current.current_story, decision.stop_after_story, 'An intentional stop is not ordinary waiting for authorization');
  assert.equal(sprint.execution_boundary_override ?? null, null, 'Clear the old boundary only through a consistent recorded resumption');
  for (const [key, state] of Object.entries(sprint.development_status)) {
    if (!/^\d+-\d+-/.test(key) || key === decision.stop_after_story) continue;
    if (!['in-progress', 'review', 'done'].includes(previousSprint.development_status[key])) {
      assert.ok(['backlog', 'ready-for-dev'].includes(state), 'Stop boundary prohibits new development dispatch: ' + key);
    }
  }
}

export function checkPreparedUiContract({ key, id, storyText, status, sprint, conditions, read, exists, sourceHash, source, obligations }) {
  const supplemental = source.slice(source.indexOf('**Code quality contract (CC 2026-09-20):**')).split('\n\n#### UI')[0].trim();
  assert.ok(supplemental && storyText.includes(supplemental), 'Prepared Story must carry its approved AR/UX and UI contract: ' + key);
  const tasks = storyText.split(/^## Tasks(?: \/ Subtasks)?\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  const relevant = conditions.filter((condition) => condition in UI_CONDITION_OWNERS);
  for (const condition of relevant) assert.ok(tasks.includes(condition), 'UI obligations must enter actual Tasks: ' + key + '/' + condition);
  for (const obligation of obligations) assert.ok(tasks.includes(obligation), 'UI source obligation must enter actual Tasks: ' + key + '/' + obligation);
  if (!['review', 'done'].includes(status) || !relevant.length) return;
  const meta = front(storyText);
  assert.ok(meta.ui_delivery_evidence && exists(meta.ui_delivery_evidence), 'UI closure needs scoped execution evidence: ' + key);
  const proof = load(read(meta.ui_delivery_evidence));
  assert.equal(proof.kind, 'ui-verification');
  assert.equal(proof.story_id, id);
  assert.equal(proof.source_contract_sha256, sourceHash);
  assert.ok(proof.source_revision && proof.recorded_at);
  for (const condition of relevant) {
    const progress = sprint.condition_progress[key]?.[condition];
    assert.ok(['verified', 'not-applicable'].includes(progress?.state), 'UI closure needs verified condition: ' + condition);
    if (UI_CONDITION_OWNERS[condition] === id) assert.equal(progress.state, 'verified', 'Primary UI delivery cannot be not-applicable');
    const check = proof.checks?.[condition];
    assert.equal(check?.result, progress.state === 'verified' ? 'passed' : 'not-applicable');
    assert.ok(check.environment && check.summary && check.evidence?.length && check.evidence.every(exists), 'UI proof needs scoped checks: ' + condition);
  }
}
