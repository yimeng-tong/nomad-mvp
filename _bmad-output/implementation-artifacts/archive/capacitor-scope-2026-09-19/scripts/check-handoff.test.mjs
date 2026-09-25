import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { checkHandoff } from './check-handoff.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const impl = '_bmad-output/implementation-artifacts';
const planning = '_bmad-output/planning-artifacts';
const sprintPath = `${impl}/sprint-status.yaml`;
const migrationPath = `${impl}/sprint-migration-2026-09-15.yaml`;
const deliveryPath = `${impl}/sprint-delivery-contract-2026-09-17.yaml`;
// Regression fixtures start at the completed SP checkpoint, independent of later live Story work.
const planningSnapshot = `${impl}/archive/story-1-0-preparation-2026-09-17`;
const load = (text) => yaml.load(text, { schema: yaml.JSON_SCHEMA });
const migration = load(readFileSync(resolve(root, migrationPath), 'utf8'));
const delivery = load(readFileSync(resolve(root, deliveryPath), 'utf8'));
const key = (id) => Object.keys(migration.story_catalog).find((k) => migration.story_catalog[k].story_id === id);

function fixture(t) {
  const directory = mkdtempSync(resolve(tmpdir(), 'nomad-handoff-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const paths = new Set([
    'CURRENT.md', 'README.md', 'AGENTS.md', '_bmad-output/project-context.md',
    'docs/prd.md', 'docs/front-end-spec.md', 'docs/ux/mobile-ia.md', 'docs/tech-spec-epic-2.md',
    sprintPath, migrationPath, `${impl}/sprint-migration-2026-09-15.md`,
    deliveryPath, `${impl}/sp-revalidation-2026-09-17.md`,
    `${planning}/implementation-readiness-sp-handoff-2026-09-15.md`,
    migration.snapshot.directory, migration.retrospective_scope['epic-1-retrospective'].evidence,
    migration.deferred_registry,
  ]);
  for (const entry of Object.values(migration.story_catalog)) {
    if (entry.scope === 'historical' && existsSync(resolve(root, entry.implementation_file))) paths.add(entry.implementation_file);
  }
  const readiness = readFileSync(resolve(root, `${planning}/implementation-readiness-sp-handoff-2026-09-15.md`), 'utf8');
  for (const match of readiness.matchAll(/^\| `([^`]+)` \| `([a-f0-9]{64})` \|$/gm)) paths.add(match[1]);
  for (const entry of migration.excluded_nonexecutables) {
    if (entry.path === `${impl}/visual`) mkdirSync(resolve(directory, entry.path), { recursive: true });
    else paths.add(entry.path);
  }
  for (const path of paths) {
    mkdirSync(dirname(resolve(directory, path)), { recursive: true });
    cpSync(resolve(root, path), resolve(directory, path), { recursive: true });
  }
  cpSync(resolve(root, planningSnapshot, 'CURRENT.md'), resolve(directory, 'CURRENT.md'));
  cpSync(resolve(root, planningSnapshot, 'sprint-status.yaml'), resolve(directory, sprintPath));
  return directory;
}

test('the live workspace handoff is valid at its current authorized phase', () => {
  const result = checkHandoff(root);
  assert.equal(result.epics, 8);
  assert.equal(result.stories, 60);
  assert.equal(result.gwt, 1018);
});

function changeYaml(directory, path, mutate) {
  const target = resolve(directory, path);
  const original = readFileSync(target, 'utf8');
  const data = load(original);
  mutate(data);
  const comments = original.match(/^(?:(?:#.*)?\n)*/)[0];
  writeFileSync(target, comments + yaml.dump(data, { lineWidth: 110, noRefs: true }));
}

function changeText(directory, path, mutate) {
  const target = resolve(directory, path);
  writeFileSync(target, mutate(readFileSync(target, 'utf8')));
}

test('approved migration remains a complete and unstarted SP handoff', (t) => {
  const result = checkHandoff(fixture(t));
  assert.deepEqual(result, {
    epics: 8, stories: 60, retrospectives: 8, gwt: 1018, epicsInProgress: 3,
    done: 7, inProgress: 1, backlog: 52, ready: 0, next: key('1.0'),
  });
});

const cases = [
  ['missing PRD requirement despite unchanged counts', (dir) => changeYaml(dir, deliveryPath,
    (d) => { delete d.requirements.FR14; }), /Every PRD FR\/NFR/],
  ['MVP requirement hidden behind historical done', (dir) => changeYaml(dir, deliveryPath,
    (d) => { d.requirements.FR1.delivery_story_keys = [key('1.1')]; }), /historical\/unknown Story/],
  ['lost first-use attribution task', (dir) => changeYaml(dir, deliveryPath,
    (d) => { delete d.source_obligations['input-attribution']; }), /PRD subclause obligations/],
  ['deferred FR counted as executable scope', (dir) => changeYaml(dir, deliveryPath,
    (d) => { d.requirements.FR40.scope = 'deferred'; }), /Incorrect scope/],
  ['old manual check-in silently reused for future photo memories', (dir) => changeYaml(dir, deliveryPath,
    (d) => { d.requirements['FR40.1'].deferred_story_ids = ['7.2']; }), /must not inherit the manual 7.2/],
  ['duplicate YAML mapping key even with identical status', (dir) => changeText(dir, sprintPath,
    (text) => text.replace('  epic-1: in-progress\n', '  epic-1: in-progress\n  epic-1: in-progress\n')), /duplicated mapping key/],
  ['missing Story', (dir) => changeYaml(dir, sprintPath, (s) => { delete s.development_status[key('6.5')]; }), /exactly 8 Epics, 60 Stories/],
  ['missing retrospective', (dir) => changeYaml(dir, sprintPath, (s) => { delete s.development_status['epic-8-retrospective']; }), /exactly 8 Epics, 60 Stories/],
  ['deferred draft inserted into executable status', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.development_status['7-2-check-in'] = 'ready-for-dev'; }), /exactly 8 Epics, 60 Stories/],
  ['condition masquerading as a product Story', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.development_status['OPS-01'] = 'backlog'; }), /exactly 8 Epics, 60 Stories/],
  ['illegal paused development status', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.development_status[key('3.1')] = 'paused'; }), /Illegal development_status/],
  ['historical Epic done leaking into expanded scope', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.development_status['epic-1'] = 'done'; }), /Expanded Epic 1/],
  ['lost historical completion', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.development_status[key('1.1')] = 'backlog'; }), /Historical done must be preserved/],
  ['same-number mapping collision', (dir) => changeYaml(dir, migrationPath,
    (m) => { m.legacy_story_mappings['2-3-feasibility-validation-and-one-click-fixes'].current_story_keys = [key('2.3')]; }), /Incorrect legacy successor/],
  ['duplicate dispatch of legacy edit', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.development_status['2-2-timeline-editing-undo-and-history'] = 'in-progress'; }), /exactly 8 Epics, 60 Stories/],
  ['legacy edit split into two execution identities', (dir) => changeYaml(dir, migrationPath,
    (m) => { m.legacy_story_mappings['2-2-timeline-editing-undo-and-history'].current_story_keys.push(key('3.2')); }), /exactly one execution identity/],
  ['lost baseline commit', (dir) => changeYaml(dir, migrationPath,
    (m) => { m.legacy_story_mappings['2-2-timeline-editing-undo-and-history'].baseline_commit = '0'.repeat(40); }), /AssertionError/],
  ['pretend readiness from the old Story file', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.execution_pauses[key('3.1')].contract_ready = true; }), /Missing current contract cannot be ready/],
  ['resuming inherited work before prerequisites', (dir) => changeYaml(dir, sprintPath,
    (s) => { s.execution_pauses[key('3.1')].paused = false; }), /pause pointer|Cannot resume 3.1/],
  ['removing the real upstream dependency', (dir) => changeYaml(dir, migrationPath,
    (m) => { m.paused_story_contract.start_after = m.paused_story_contract.start_after.filter((k) => k !== key('2.10')); }), /actual upstream prerequisites/],
  ['lost historical retrospective scope', (dir) => {
    changeYaml(dir, sprintPath, (s) => { s.retrospective_scope['epic-1-retrospective'].expanded_scope_review_required = false; });
    changeYaml(dir, migrationPath, (m) => { m.retrospective_scope['epic-1-retrospective'].expanded_scope_review_required = false; });
  }, /AssertionError/],
  ['missing engineering condition', (dir) => changeYaml(dir, migrationPath,
    (m) => { delete m.implementation_conditions['OPS-02']; }), /all seven engineering conditions/],
  ['unassigned engineering work', (dir) => changeYaml(dir, migrationPath,
    (m) => { m.implementation_conditions['OPS-01'].delivery_assignee = ''; }), /named project executor/],
  ['early measurement postponed until Epic 8', (dir) => changeYaml(dir, migrationPath,
    (m) => { m.story_condition_bindings[key('1.0')] = m.story_condition_bindings[key('1.0')].filter((id) => id !== 'METRICS-01'); }), /Condition bindings drifted/],
  ['changed approved contract under unchanged inventory', (dir) => changeText(dir, `${planning}/epics.md`,
    (text) => text.replace('### Story 1.0: 生产登录与多设备会话补齐', '### Story 1.0: Changed contract')), /Approved planning input changed/],
  ['overwritten historical snapshot', (dir) => changeText(dir, `${migration.snapshot.directory}/sprint-status.before.yaml`,
    (text) => text.replace('  epic-1: done', '  epic-1: backlog')), /Historical snapshot changed/],
  ['current auth Story silently created during SP', (dir) => {
    writeFileSync(resolve(dir, migration.story_catalog[key('1.0')].implementation_file), '# Story 1.0\n\nStatus: ready-for-dev\n');
  }, /must not create implementation Stories/],
  ['unmapped draft marked ready at the implementation root', (dir) => {
    writeFileSync(resolve(dir, `${impl}/7-2-old-check-in-draft.md`), '# Old draft\n\nStatus: ready-for-dev\n');
  }, /Unmapped draft cannot be dispatched/],
  ['unauthorized direct dev handoff', (dir) => changeText(dir, 'CURRENT.md',
    (text) => text.replace('implementation_authorized: false', 'implementation_authorized: true')), /AssertionError/],
];

for (const [name, mutate, expected] of cases) {
  test(`rejects ${name}`, (t) => {
    const directory = fixture(t);
    mutate(directory);
    assert.throws(() => checkHandoff(directory), expected);
  });
}

// Later-state checks use isolated synthetic documents; no real implementation Story is created.
function changeCurrent(directory, mutate) {
  changeText(directory, 'CURRENT.md', (text) => text.replace(/^---\n([\s\S]*?)\n---/, (_, front) => {
    const data = load(front);
    mutate(data);
    return `---\n${yaml.dump(data, { lineWidth: 110 })}---`;
  }));
}

function preparedStory(directory, id, state, { audited = false } = {}) {
  const storyKey = key(id);
  const entry = migration.story_catalog[storyKey];
  const epics = readFileSync(resolve(directory, `${planning}/epics.md`), 'utf8');
  const start = epics.indexOf(`### Story ${id}:`);
  const next = epics.slice(start + 1).search(/^## Epic |^### Story /m);
  const body = epics.slice(start, next < 0 ? undefined : start + 1 + next);
  const meta = { source_story_id: id, source_contract_sha256: entry.contract_sha256 };
  if (id === '3.1') {
    meta.legacy_story_id = '2-2-timeline-editing-undo-and-history';
    meta.baseline_commit = migration.paused_story_contract.baseline_commit;
    meta.migration_audit_complete = audited;
    meta.migration_audit_evidence = `${impl}/fixture-migration-audit.md`;
    if (audited) writeFileSync(resolve(directory, meta.migration_audit_evidence), 'Synthetic keep/change/remove audit for checker regression only.\n');
  }
  const requirements = delivery.story_requirement_bindings[storyKey];
  const conditions = migration.story_condition_bindings[storyKey];
  const obligations = Object.entries(delivery.source_obligations).filter(([, v]) => v.story_keys.includes(storyKey)).map(([name]) => name);
  writeFileSync(resolve(directory, entry.implementation_file), `---\n${yaml.dump(meta)}---\n\nStatus: ${state}\n\n${body}\n## Test-only task handoff\n\n${deliveryPath}\n${requirements.join(', ')}\n${conditions.join(', ')}\n${obligations.join(', ')}\n`);
  changeYaml(directory, sprintPath, (s) => { s.development_status[storyKey] = state; });
}

function executionHandoff(directory, id, state, nextId, { paused = false } = {}) {
  const storyKey = id === null ? null : key(id);
  const action = id === null ? 'bmad-retrospective' : paused ? 'bmad-sprint-status'
    : state === 'ready-for-dev' || state === 'in-progress' ? 'bmad-dev-story'
      : state === 'review' ? 'bmad-code-review' : 'bmad-create-story';
  changeYaml(directory, sprintPath, (s) => {
    s.execution_phase = 'execution';
    s.authorization.create_story = true;
    s.authorization.implementation = state !== 'ready-for-dev';
    s.next_story_to_prepare = nextId === null ? null : key(nextId);
  });
  changeCurrent(directory, (c) => {
    c.execution_phase = 'execution';
    c.create_story_authorized = true;
    c.implementation_authorized = state !== 'ready-for-dev';
    c.current_story = storyKey;
    c.current_story_status = state;
    c.current_epic = id === null ? null : Number(id.split('.')[0]);
    c.current_story_file = storyKey === null ? null : migration.story_catalog[storyKey].implementation_file;
    c.working_branch = id === '3.1' ? migration.paused_story_contract.working_branch : 'codex/story-1-0-production-login';
    c.next_bmad_action = action;
    c.next_bmad_checkpoint = 'synthetic-authorized-transition';
    c.handoff_status = 'synthetic-execution-handoff';
    if (state === 'done') c.last_completed_story = storyKey;
  });
}

for (const state of ['ready-for-dev', 'in-progress', 'review', 'done']) {
  test(`allows later authorized 1.0 ${state} without rewriting the checker or history`, (t) => {
    const directory = fixture(t);
    preparedStory(directory, '1.0', state);
    executionHandoff(directory, '1.0', state, '1.6');
    const result = checkHandoff(directory);
    assert.equal(result.next, key('1.6'));
    assert.equal(result.done, state === 'done' ? 8 : 7);
  });
}

test('rejects a prepared contract that omitted its source attribution task', (t) => {
  const directory = fixture(t);
  preparedStory(directory, '1.0', 'ready-for-dev');
  executionHandoff(directory, '1.0', 'ready-for-dev', '1.6');
  changeText(directory, migration.story_catalog[key('1.0')].implementation_file, (s) => s.replace('login-attribution', 'omitted-task'));
  assert.throws(() => checkHandoff(directory), /source obligation login-attribution/);
});

test('rejects stale source contracts in prepared stories', (t) => {
  const directory = fixture(t);
  preparedStory(directory, '1.0', 'ready-for-dev');
  executionHandoff(directory, '1.0', 'ready-for-dev', '1.6');
  changeText(directory, migration.story_catalog[key('1.0')].implementation_file,
    (s) => s.replace(migration.story_catalog[key('1.0')].contract_sha256, '0'.repeat(64)));
  assert.throws(() => checkHandoff(directory), /pin its approved contract/);
});

test('selects the inherited 3.1 contract instead of skipping it for the next backlog', (t) => {
  const directory = fixture(t);
  const preceding = migration.preparation_order.slice(0, migration.preparation_order.indexOf(key('3.1')));
  for (const storyKey of preceding) preparedStory(directory, migration.story_catalog[storyKey].story_id, 'done');
  executionHandoff(directory, '2.15', 'done', '3.1');
  assert.equal(checkHandoff(directory).next, key('3.1'));
  changeYaml(directory, sprintPath, (s) => { s.next_story_to_prepare = key('3.2'); });
  assert.throws(() => checkHandoff(directory), /inherited unprepared 3.1/);
});

test('a prepared 3.1 contract retains inherited work and its pause', (t) => {
  const directory = fixture(t);
  for (const storyKey of migration.preparation_order.slice(0, migration.preparation_order.indexOf(key('3.1')))) {
    preparedStory(directory, migration.story_catalog[storyKey].story_id, 'done');
  }
  preparedStory(directory, '3.1', 'in-progress');
  changeYaml(directory, sprintPath, (s) => { s.execution_pauses[key('3.1')].contract_ready = true; });
  executionHandoff(directory, '3.1', 'in-progress', '3.2', { paused: true });
  assert.equal(checkHandoff(directory).inProgress, 1);
  changeCurrent(directory, (c) => { c.next_bmad_action = 'bmad-dev-story'; });
  assert.throws(() => checkHandoff(directory), /Next action must match/);
});

test('resuming 3.1 requires actual upstream states and a separate migration audit', (t) => {
  const directory = fixture(t);
  for (const storyKey of migration.preparation_order.slice(0, migration.preparation_order.indexOf(key('3.1')))) {
    preparedStory(directory, migration.story_catalog[storyKey].story_id, 'done');
  }
  preparedStory(directory, '3.1', 'in-progress', { audited: true });
  changeYaml(directory, sprintPath, (s) => { s.execution_pauses[key('3.1')].paused = false; s.execution_pauses[key('3.1')].contract_ready = true; });
  executionHandoff(directory, '3.1', 'in-progress', '3.2');
  changeCurrent(directory, (c) => { c.paused_story = null; });
  assert.equal(checkHandoff(directory).next, key('3.2'));
  preparedStory(directory, '3.1', 'in-progress', { audited: false });
  assert.throws(() => checkHandoff(directory), /keep\/change\/remove audit/);
});

test('allows scoped engineering progress while the original SP snapshot remains unchanged', (t) => {
  const directory = fixture(t);
  preparedStory(directory, '1.0', 'in-progress');
  executionHandoff(directory, '1.0', 'in-progress', '1.6');
  const evidence = `${impl}/fixture-ops-evidence.md`;
  writeFileSync(resolve(directory, evidence), 'Synthetic scoped evidence for this checker test only.\n');
  changeYaml(directory, sprintPath, (s) => {
    s.condition_progress[key('1.0')] = { 'OPS-01': { state: 'verified', summary: 'Specific test instance only', evidence: [evidence] } };
  });
  assert.equal(checkHandoff(directory).inProgress, 2);
  changeYaml(directory, sprintPath, (s) => { s.condition_progress[key('1.0')]['OPS-01'].evidence = []; });
  assert.throws(() => checkHandoff(directory), /needs scoped evidence/);
});

test('expanded Epic1 can close only with all current stories and a separately evidenced retrospective', (t) => {
  const directory = fixture(t);
  for (const storyKey of migration.preparation_order.filter((k) => k.startsWith('1-'))) {
    preparedStory(directory, migration.story_catalog[storyKey].story_id, 'done');
  }
  const evidence = `${impl}/fixture-expanded-retro.md`;
  writeFileSync(resolve(directory, evidence), 'Synthetic expanded retrospective evidence for this checker test only.\n');
  changeYaml(directory, sprintPath, (s) => {
    s.development_status['epic-1'] = 'done';
    Object.assign(s.retrospective_scope['epic-1-retrospective'], {
      expanded_scope_review_required: false, expanded_scope_evidence: evidence,
      expanded_scope_story_keys: Object.keys(migration.story_catalog).filter((k) => k.startsWith('1-')),
    });
  });
  executionHandoff(directory, '1.11', 'done', '2.3');
  assert.equal(checkHandoff(directory).done, 14);
  changeYaml(directory, sprintPath, (s) => { s.retrospective_scope['epic-1-retrospective'].expanded_scope_story_keys.pop(); });
  assert.throws(() => checkHandoff(directory), /full current Epic/);
});

test('supports completion of the whole planned queue without corrupting historical identities', (t) => {
  const directory = fixture(t);
  for (const storyKey of migration.preparation_order) {
    preparedStory(directory, migration.story_catalog[storyKey].story_id, 'done', { audited: true });
  }
  changeYaml(directory, sprintPath, (s) => {
    for (let epic = 1; epic <= 8; epic++) s.development_status[`epic-${epic}`] = 'done';
    s.execution_pauses[key('3.1')].paused = false;
    s.execution_pauses[key('3.1')].contract_ready = true;
  });
  executionHandoff(directory, null, null, null);
  changeCurrent(directory, (c) => { c.paused_story = null; c.last_completed_story = key('8.6'); });
  const result = checkHandoff(directory);
  assert.equal(result.done, 60);
  assert.equal(result.next, null);
});
