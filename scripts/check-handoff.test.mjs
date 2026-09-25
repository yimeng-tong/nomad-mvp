import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';
import { checkHandoff } from './check-handoff.mjs';
import { storyBlocks } from './check-capacitor-scope.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const impl = '_bmad-output/implementation-artifacts';
const planning = '_bmad-output/planning-artifacts';
const sprintPath = `${impl}/sprint-status.yaml`;
const migrationPath = `${impl}/sprint-migration-2026-09-15.yaml`;
const deliveryPath = `${impl}/sprint-delivery-contract-2026-09-17.yaml`;
// Regression fixtures start at the completed SP checkpoint, independent of later live Story work.
const planningSnapshot = `${impl}/archive/story-1-0-preparation-2026-09-17`;
const amendmentSnapshot = `${impl}/archive/capacitor-scope-2026-09-19`;
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
  // Source documents now have an approved amendment. The original regression suite
  // still exercises its own immutable SP input, never a mix of old state/new sources.
  const frozen = JSON.parse(readFileSync(resolve(root, amendmentSnapshot, 'snapshot-manifest.json'), 'utf8'));
  for (const path of Object.keys(frozen.files)) {
    if (!existsSync(resolve(directory, path))) continue;
    cpSync(resolve(root, amendmentSnapshot, path), resolve(directory, path));
  }
  cpSync(resolve(root, planningSnapshot, 'CURRENT.md'), resolve(directory, 'CURRENT.md'));
  cpSync(resolve(root, planningSnapshot, 'sprint-status.yaml'), resolve(directory, sprintPath));
  return directory;
}

test('the live workspace handoff is valid at its current authorized phase', () => {
  const result = checkHandoff(root);
  const live = load(readFileSync(resolve(root, sprintPath), 'utf8'));
  const counts = load(readFileSync(resolve(root, live.migration_manifest), 'utf8')).scope_counts;
  assert.equal(result.epics, counts.epics);
  assert.equal(result.stories, counts.stories);
  assert.equal(result.gwt, counts.gwt_scenarios);
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

const appMigrationPath = `${impl}/sprint-migration-2026-09-19.yaml`;
const appDeliveryPath = `${impl}/sprint-delivery-contract-2026-09-19.yaml`;
const appMigration = load(readFileSync(resolve(root, appMigrationPath), 'utf8'));
const appKey = (id) => Object.keys(appMigration.story_catalog).find((k) => appMigration.story_catalog[k].story_id === id);
const hash = (text) => createHash('sha256').update(text).digest('hex');
function appFixture(t) {
  const directory = fixture(t);
  const paths = new Set([
    'CURRENT.md', 'README.md', 'AGENTS.md', '_bmad-output/project-context.md',
    sprintPath, appMigrationPath, appDeliveryPath, `${impl}/sprint-migration-2026-09-19.md`,
    appMigration.scope_change.decision, appMigration.scope_change.readiness_report, amendmentSnapshot,
    'docs/prd.md', 'docs/front-end-spec.md', 'docs/ux/mobile-ia.md', 'docs/tech-spec-epic-2.md',
    `${planning}/epics.md`, `${planning}/prd.md`, `${impl}/2-2-timeline-editing-undo-and-history.md`,
  ]);
  for (const name of ['architecture', 'ux', 'supporting-tech-specs']) {
    const file = `${planning}/${name}.md`; paths.add(file);
    for (const marker of readFileSync(resolve(root, file), 'utf8').matchAll(/^## Source: `([^`]+)`/gm)) paths.add(marker[1]);
  }
  for (const c of Object.values(appMigration.implementation_conditions)) paths.add(c.source);
  // Copy only explicit repository evidence references, never the working tree or node_modules.
  const references = (value) => {
    if (typeof value === 'string' && !value.startsWith('/') && /\.(?:md|ya?ml|json|png)$/.test(value) && existsSync(resolve(root, value))) paths.add(value);
    else if (Array.isArray(value)) value.forEach(references);
    else if (value && typeof value === 'object') Object.values(value).forEach(references);
  };
  references(load(readFileSync(resolve(root, sprintPath), 'utf8')).condition_progress);
  for (const entry of Object.values(appMigration.story_catalog)) {
    if (!existsSync(resolve(root, entry.implementation_file))) continue;
    paths.add(entry.implementation_file);
    const text = readFileSync(resolve(root, entry.implementation_file), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (fm) {
      const meta = load(fm[1]); references(meta);
      if (meta.app_delivery_evidence && existsSync(resolve(root, meta.app_delivery_evidence))) references(load(readFileSync(resolve(root, meta.app_delivery_evidence), 'utf8')));
    }
  }
  for (const file of paths) {
    mkdirSync(dirname(resolve(directory, file)), { recursive: true });
    cpSync(resolve(root, file), resolve(directory, file), { recursive: true });
  }
  // Keep this regression lane at the sealed Capacitor checkpoint, not the UI successor.
  const uiArchive = `${impl}/archive/ui-foundation-2026-09-20`;
  const manifest = JSON.parse(readFileSync(resolve(root, uiArchive, 'snapshot-manifest.json'), 'utf8'));
  for (const file of Object.keys(manifest.files)) {
    mkdirSync(dirname(resolve(directory, file)), { recursive: true });
    cpSync(resolve(root, uiArchive, file), resolve(directory, file));
  }
  for (const packet of ['architecture', 'ux', 'supporting-tech-specs']) {
    const text = readFileSync(resolve(directory, planning, packet + '.md'), 'utf8');
    const markers = [...text.matchAll(/^## Source: \x60([^\x60]+)\x60\n/gm)];
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const body = text.slice(marker.index + marker[0].length, markers[i + 1]?.index ?? text.length).trim().replace(/\n\n---$/, '').trim();
      mkdirSync(dirname(resolve(directory, marker[1])), { recursive: true });
      writeFileSync(resolve(directory, marker[1]), body + '\n');
    }
  }
  changeText(directory, `${impl}/2-2-timeline-editing-undo-and-history.md`, (text) => text.replace('sprint-migration-ui-foundation-2026-09-20.yaml', 'sprint-migration-2026-09-19.yaml'));
  return directory;
}

test('approved Capacitor scope preserves SP history and admits new current contracts', (t) => {
  const result = checkHandoff(appFixture(t));
  assert.equal(result.epics, 9); assert.equal(result.stories, 62); assert.equal(result.gwt, 1052);
});

const appCases = [
  ['changed approval record', (dir) => changeText(dir, appMigration.scope_change.decision, (s) => s.replace('status: approved', 'status: proposed')), /explicit scope approval record/],
  ['altered pre-amendment source snapshot', (dir) => changeText(dir, `${amendmentSnapshot}/docs/prd.md`, (s) => s + '\nchanged\n'), /historical snapshot changed/],
  ['forged approved appendix with refreshed snapshot hashes', (dir) => {
    const appendix = `${amendmentSnapshot}/${planning}/sprint-change-capacitor-contracts-2026-09-19.md`;
    changeText(dir, appendix, (s) => s.replace('真实 U-App 环境查询', 'fixture 日志代替'));
    const manifestFile = `${amendmentSnapshot}/snapshot-manifest.json`;
    const manifest = JSON.parse(readFileSync(resolve(dir, manifestFile), 'utf8'));
    manifest.files[`${planning}/sprint-change-capacitor-contracts-2026-09-19.md`].sha256 = hash(readFileSync(resolve(dir, appendix), 'utf8'));
    writeFileSync(resolve(dir, manifestFile), JSON.stringify(manifest));
    changeText(dir, `${planning}/epics.md`, (s) => s.replace('真实 U-App 环境查询', 'fixture 日志代替'));
    const epics = readFileSync(resolve(dir, `${planning}/epics.md`), 'utf8');
    const contractHash = hash(storyBlocks(epics)['1.0']);
    changeText(dir, appMigration.story_catalog[appKey('1.0')].implementation_file, (s) => s.replace('真实 U-App 环境查询', 'fixture 日志代替').replace(appMigration.story_catalog[appKey('1.0')].contract_sha256, contractHash));
    changeYaml(dir, appMigrationPath, (m) => { m.scope_change.snapshot_manifest_sha256 = hash(readFileSync(resolve(dir, manifestFile), 'utf8')); m.epics_sha256 = hash(epics); m.story_catalog[appKey('1.0')].contract_sha256 = contractHash; });
  }, /approved input snapshot fingerprint/],
  ['lost native GWT even after refreshing catalog hashes', (dir) => {
    changeText(dir, `${planning}/epics.md`, (s) => s.replace('真实 U-App 环境查询', '测试日志代替'));
    const epics = readFileSync(resolve(dir, `${planning}/epics.md`), 'utf8');
    changeYaml(dir, appMigrationPath, (m) => { m.epics_sha256 = hash(epics); m.story_catalog[appKey('1.0')].contract_sha256 = hash(storyBlocks(epics)['1.0']); });
  }, /source GWT obligations drifted/],
  ['prepared Story text drift despite correct source fingerprint', (dir) => changeText(dir, appMigration.story_catalog[appKey('1.0')].implementation_file, (s) => s.replace('真实 U-App 环境查询', '测试日志代替')), /Prepared Story changed or omitted approved GWT/],
  ['App condition only in metadata instead of Tasks', (dir) => changeText(dir, appMigration.story_catalog[appKey('1.0')].implementation_file, (s) => {
    const [before, rest] = s.split('## Tasks / Subtasks'); const split = rest.indexOf('## Dev Notes');
    return before + '## Tasks / Subtasks' + rest.slice(0, split).replaceAll('APP-HOST-01', 'omitted-host-condition') + rest.slice(split);
  }), /Native obligations must enter actual Tasks/],
  ['FR52 without first-use auth ownership', (dir) => changeYaml(dir, appDeliveryPath, (d) => { d.requirements.FR52.delivery_story_keys = d.requirements.FR52.delivery_story_keys.filter((k) => k !== appKey('1.0')); }), /Requirement binding mismatch|FR52 lost/],
  ['source order substituted for approved preparation order', (dir) => changeYaml(dir, appMigrationPath, (m) => { m.preparation_order = Object.keys(m.story_catalog).filter((k) => m.story_catalog[k].scope === 'current-target'); }), /approved preparation order/],
  ['foundation-auth circular dependency', (dir) => changeYaml(dir, appMigrationPath, (m) => { m.dependencies[appKey('9.1')] = [appKey('1.0')]; }), /Forward\/cyclic dependency/],
  ['new scope overwrites original SP authorization', (dir) => changeYaml(dir, appMigrationPath, (m) => { m.authorization.implementation = true; }), /preserve historical authorization/],
  ['missing App distribution obligation', (dir) => changeYaml(dir, appDeliveryPath, (d) => { delete d.source_obligations['app-build-delivery']; }), /PRD subclause obligations/],
  ['unsynchronized architecture mirror', (dir) => changeText(dir, 'docs/architecture/app-host.md', (s) => s + '\nunmirrored change\n'), /Source packet drifted/],
  ['old Web auth marked review before the App host is delivered', (dir) => changeYaml(dir, sprintPath, (s) => { s.development_status[appKey('1.0')] = 'review'; s.development_status[appKey('9.1')] = 'backlog'; }), /Cannot close .*before required delivery evidence/],
  ['premature inherited editing resume after scope change', (dir) => changeYaml(dir, sprintPath, (s) => { s.execution_pauses[appKey('3.1')].paused = false; }), /pause pointer|Cannot resume 3.1/],
];
for (const [name, mutate, pattern] of appCases) test(`Capacitor rejects ${name}`, (t) => {
  const directory = appFixture(t); mutate(directory); assert.throws(() => checkHandoff(directory), pattern);
});

test('App closure rejects fixture install proof despite verified status flags', (t) => {
  const directory = appFixture(t), entry = appMigration.story_catalog[appKey('9.1')];
  const source = storyBlocks(readFileSync(resolve(directory, `${planning}/epics.md`), 'utf8'))['9.1'];
  const evidence = `${impl}/fixture-app-evidence.yaml`;
  const meta = { source_story_id: '9.1', source_contract_sha256: entry.contract_sha256, app_delivery_evidence: evidence };
  const delivery = load(readFileSync(resolve(directory, appDeliveryPath), 'utf8'));
  writeFileSync(resolve(directory, entry.implementation_file), `---\n${yaml.dump(meta)}---\n\nStatus: done\n\n${source}\n## Tasks / Subtasks\n\n${appDeliveryPath}\n${appMigration.story_condition_bindings[appKey('9.1')].join(', ')}\n${delivery.story_requirement_bindings[appKey('9.1')].join(', ')}\napp-build-delivery\n`);
  writeFileSync(resolve(directory, evidence), 'kind: fixture\n');
  changeYaml(directory, sprintPath, (s) => {
    s.development_status[appKey('9.1')] = 'done'; s.development_status['epic-9'] = 'in-progress';
    s.next_story_to_prepare = appKey('1.6');
    s.condition_progress[appKey('9.1')]['APP-HOST-01'] = { state: 'verified', summary: 'Synthetic fixture only', evidence: [evidence] };
  });
  assert.throws(() => checkHandoff(directory), /Configuration or fixture evidence/);
});

test('a host-bound Story without an added Cxx scenario still requires native closure evidence', (t) => {
  const directory = appFixture(t), entry = appMigration.story_catalog[appKey('2.3')];
  const source = storyBlocks(readFileSync(resolve(directory, `${planning}/epics.md`), 'utf8'))['2.3'];
  const delivery = load(readFileSync(resolve(directory, appDeliveryPath), 'utf8'));
  const meta = { source_story_id: '2.3', source_contract_sha256: entry.contract_sha256 };
  writeFileSync(resolve(directory, entry.implementation_file), `---\n${yaml.dump(meta)}---\n\nStatus: done\n\n${source}\n## Tasks / Subtasks\n\n${appDeliveryPath}\n${appMigration.story_condition_bindings[appKey('2.3')].join(', ')}\n${delivery.story_requirement_bindings[appKey('2.3')].join(', ')}\n`);
  changeYaml(directory, sprintPath, (s) => { s.development_status[appKey('2.3')] = 'done'; });
  assert.throws(() => checkHandoff(directory), /Native closure needs scoped APP-HOST-01 proof/);
});

const uiMigrationPath = impl + '/sprint-migration-ui-foundation-2026-09-20.yaml';
const uiDeliveryPath = impl + '/sprint-delivery-contract-ui-foundation-2026-09-20.yaml';
const uiMigration = load(readFileSync(resolve(root, uiMigrationPath), 'utf8'));
const uiKey = (id) => Object.keys(uiMigration.story_catalog).find((key) => uiMigration.story_catalog[key].story_id === id);
function uiFixture(t) {
  const directory = appFixture(t);
  const paths = new Set([
    'CURRENT.md', 'README.md', 'AGENTS.md', '_bmad-output/project-context.md',
    sprintPath, uiMigrationPath, uiDeliveryPath, impl + '/sprint-migration-ui-foundation-2026-09-20.md',
    uiMigration.scope_change.decision, uiMigration.scope_change.readiness_report,
    uiMigration.scope_change.snapshot_directory,
    'docs/prd.md', 'docs/front-end-spec.md', 'docs/ux/mobile-ia.md',
    planning + '/epics.md', planning + '/prd.md', impl + '/2-2-timeline-editing-undo-and-history.md',
  ]);
  for (const packet of ['architecture', 'ux', 'supporting-tech-specs']) {
    const path = planning + '/' + packet + '.md'; paths.add(path);
    for (const marker of readFileSync(resolve(root, path), 'utf8').matchAll(/^## Source: \x60([^\x60]+)\x60/gm)) paths.add(marker[1]);
  }
  for (const item of Object.values(uiMigration.implementation_conditions)) paths.add(item.source);
  for (const entry of Object.values(uiMigration.story_catalog)) if (existsSync(resolve(root, entry.implementation_file))) paths.add(entry.implementation_file);
  for (const path of paths) {
    mkdirSync(dirname(resolve(directory, path)), { recursive: true });
    cpSync(resolve(root, path), resolve(directory, path), { recursive: true });
  }
  // Anchor this regression lane before Story9.4 preparation; the live-workspace test above
  // separately follows normal ready/in-progress transitions without resetting their history.
  const checkpoint = impl + '/archive/story-9-4-preparation-2026-09-25';
  for (const path of ['CURRENT.md', sprintPath, '_bmad-output/project-context.md']) {
    cpSync(resolve(root, checkpoint, path), resolve(directory, path));
  }
  const state = load(readFileSync(resolve(directory, sprintPath), 'utf8'));
  for (const [key, entry] of Object.entries(uiMigration.story_catalog)) {
    if (state.development_status[key] === 'backlog') {
      rmSync(resolve(directory, entry.implementation_file), { force: true });
    }
  }
  return directory;
}
function prepareUiStory(directory, id, state) {
  const entry = uiMigration.story_catalog[uiKey(id)];
  const source = storyBlocks(readFileSync(resolve(directory, planning, 'epics.md'), 'utf8'))[id];
  const delivery = load(readFileSync(resolve(directory, uiDeliveryPath), 'utf8'));
  const meta = { source_story_id: id, source_contract_sha256: entry.contract_sha256 };
  const tasks = [
    uiDeliveryPath, ...uiMigration.story_condition_bindings[uiKey(id)],
    ...delivery.story_requirement_bindings[uiKey(id)],
    ...Object.entries(delivery.source_obligations).filter(([, o]) => o.story_keys.includes(uiKey(id))).map(([name]) => name),
  ].join('\n');
  writeFileSync(resolve(directory, entry.implementation_file), '---\n' + yaml.dump(meta) + '---\n\nStatus: ' + state + '\n\n' + source + '\n## Tasks / Subtasks\n\n' + tasks + '\n');
  changeYaml(directory, sprintPath, (s) => { s.development_status[uiKey(id)] = state; });
}
function recordUiResume(directory, ids, stop = null) {
  const path = impl + '/fixture-explicit-resume.yaml.md';
  const record = { status:'approved', action:'resume-execution', supersedes_stop_after_story:uiKey('1.7'), scope_revision:'ui-foundation-2026-09-20', user_request:'Synthetic later user direction for checker regression only', recorded_at:'2026-09-20', stop_after_story:stop, allowed_story_keys:ids.map(uiKey) };
  writeFileSync(resolve(directory, path), '---\n' + yaml.dump(record) + '---\nSynthetic test only.\n');
  changeYaml(directory, sprintPath, (s) => { s.stop_after_story = stop; s.execution_boundary_override = path; });
  changeCurrent(directory, (c) => { c.stop_after_story = stop; });
}

test('UI scope preserves the prior approval chain and exposes the approved preparation queue', (t) => {
  const result = checkHandoff(uiFixture(t));
  assert.equal(result.stories, 67); assert.equal(result.gwt, 1089);
  assert.equal(result.next, uiKey('9.4'));
});
test('UI preparation can advance without resuming development', (t) => {
  const dir = uiFixture(t); prepareUiStory(dir, '9.4', 'ready-for-dev');
  changeYaml(dir, sprintPath, (s) => { s.next_story_to_prepare = uiKey('9.5'); });
  assert.equal(checkHandoff(dir).ready, 1);
});
test('recorded later user direction can resume a bounded UI development window', (t) => {
  const dir = uiFixture(t); prepareUiStory(dir, '9.4', 'in-progress');
  recordUiResume(dir, ['9.4'], uiKey('9.4'));
  changeYaml(dir, sprintPath, (s) => { s.next_story_to_prepare = uiKey('9.5'); });
  changeCurrent(dir, (c) => { c.current_story = uiKey('9.4'); c.current_story_status = 'in-progress'; c.current_story_file = uiMigration.story_catalog[uiKey('9.4')].implementation_file; c.current_epic = 9; });
  assert.equal(checkHandoff(dir).next, uiKey('9.5'));
});
test('historical source packet checks allow a later synchronized live source edit', (t) => {
  const dir = uiFixture(t), source = 'docs/ux/home-import-dock.md';
  const before = readFileSync(resolve(dir, source), 'utf8').trim();
  const after = before + '\n\nScoped current documentation maintenance.\n';
  writeFileSync(resolve(dir, source), after);
  changeText(dir, planning + '/ux.md', (text) => text.replace(before, after.trim()));
  assert.equal(checkHandoff(dir).stories, 67);
});
const uiCases = [
  ['changed UI approval', (dir) => changeText(dir, uiMigration.scope_change.decision, (s) => s.replace('status: approved', 'status: proposed')), /UI explicit approval/],
  ['changed frozen UI snapshot', (dir) => changeText(dir, uiMigration.scope_change.snapshot_directory + '/docs/prd.md', (s) => s + '\nchanged\n'), /UI input snapshot changed/],
  ['rewritten previous delivery', (dir) => changeText(dir, appDeliveryPath, (s) => s + '\n# rewritten\n'), /previous delivery contract/],
  ['rewritten previous catalog', (dir) => changeText(dir, appMigrationPath, (s) => s + '\n# rewritten\n'), /previous catalog/],
  ['changed approved source GWT despite refreshed catalog hashes', (dir) => {
    changeText(dir, planning + '/epics.md', (s) => s.replace('最低iOS16.4声明', '最低iOS16.0声明'));
    const text = readFileSync(resolve(dir, planning, 'epics.md'), 'utf8');
    changeYaml(dir, uiMigrationPath, (m) => { m.epics_sha256 = hash(text); m.story_catalog[uiKey('9.1')].contract_sha256 = hash(storyBlocks(text)['9.1']); });
  }, /UI approved source contract drifted/],
  ['prepared AR and UX supplement omitted', (dir) => changeText(dir, uiMigration.story_catalog[uiKey('1.6')].implementation_file, (s) => s.replaceAll('UX-DR37', 'omitted-ux')), /approved AR\/UX and UI contract/],
  ['quality condition omitted from actual Tasks', (dir) => changeText(dir, uiMigration.story_catalog[uiKey('1.6')].implementation_file, (s) => {
    const start = s.indexOf('## Tasks'), end = s.indexOf('\n## ', start + 3);
    return s.slice(0, start) + s.slice(start, end).replaceAll('UI-BROWSER-01', 'omitted-browser') + s.slice(end);
  }), /UI obligations must enter actual Tasks/],
  ['missing shared UI source obligation', (dir) => changeYaml(dir, uiDeliveryPath, (d) => { delete d.source_obligations['shared-ui-adoption']; }), /PRD subclause obligations/],
  ['source numeric order substituted for execution order', (dir) => changeYaml(dir, uiMigrationPath, (m) => { m.preparation_order = Object.keys(m.story_catalog).filter((k) => m.story_catalog[k].scope === 'current-target'); }), /approved UI preparation order/],
  ['removed original native closure dependency', (dir) => changeYaml(dir, uiMigrationPath, (m) => { m.closure_dependencies = {}; }), /native authentication closure/],
  ['UI work dispatched while original stop remains', (dir) => prepareUiStory(dir, '9.4', 'in-progress'), /Stop boundary prohibits/],
  ['stop removed without later user record', (dir) => {
    changeYaml(dir, sprintPath, (s) => { s.stop_after_story = null; });
    changeCurrent(dir, (c) => { c.stop_after_story = null; });
  }, /recorded later user direction/],
  ['resumption exceeds its newly recorded stopping point', (dir) => recordUiResume(dir, ['9.4', '9.5'], uiKey('9.4')), /beyond its new stopping point/],
  ['new component migration starts before baseline tools are delivered', (dir) => {
    recordUiResume(dir, ['9.3']); prepareUiStory(dir, '9.3', 'in-progress');
  }, /delivered workbench\/browser prerequisites/],
  ['tool source mirror drift', (dir) => changeText(dir, 'docs/ops/ui-validation.md', (s) => s + '\nunmirrored\n'), /Source packet drifted/],
];
for (const [name, mutate, pattern] of uiCases) test('UI rejects ' + name, (t) => {
  const dir = uiFixture(t); mutate(dir); assert.throws(() => checkHandoff(dir), pattern);
});
for (const result of ['failed', 'missing']) test('Query cannot consume ' + result + ' local UI proof', (t) => {
  const dir = uiFixture(t); recordUiResume(dir, ['9.4', '9.5', '9.3', '9.6']);
  for (const id of ['9.4', '9.5']) prepareUiStory(dir, id, 'done');
  prepareUiStory(dir, '9.3', 'in-progress'); prepareUiStory(dir, '9.6', 'in-progress');
  const evidence = impl + '/fixture-local-ui.yaml';
  const proof = { kind:'local-ui-regression', story_id:'9.3', source_contract_sha256:uiMigration.story_catalog[uiKey('9.3')].contract_sha256, source_revision:'synthetic', recorded_at:'2026-09-20', evidence:[evidence], checks:[{ result:'passed' }] };
  if (result === 'failed') proof.result = 'failed';
  writeFileSync(resolve(dir, evidence), yaml.dump(proof));
  changeYaml(dir, sprintPath, (s) => { s.scope_local_slice_progress = { [uiKey('9.3')]: { 'shared-ui-local-regression-passed': { state:'verified', evidence } } }; });
  assert.throws(() => checkHandoff(dir), /Failed local UI regression/);
});
test('Query cannot consume a backlog UI foundation even with claimed local proof', (t) => {
  const dir = uiFixture(t); recordUiResume(dir, ['9.4','9.5','9.6']);
  for (const id of ['9.4','9.5']) prepareUiStory(dir,id,'done');
  prepareUiStory(dir,'9.6','in-progress');
  assert.throws(() => checkHandoff(dir), /must actually be implemented/);
});
