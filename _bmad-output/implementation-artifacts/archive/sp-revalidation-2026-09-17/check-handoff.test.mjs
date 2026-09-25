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
const load = (text) => yaml.load(text, { schema: yaml.JSON_SCHEMA });
const migration = load(readFileSync(resolve(root, migrationPath), 'utf8'));
const key = (id) => Object.keys(migration.story_catalog).find((k) => migration.story_catalog[k].story_id === id);

function fixture(t) {
  const directory = mkdtempSync(resolve(tmpdir(), 'nomad-handoff-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const paths = new Set([
    'CURRENT.md', 'README.md', 'AGENTS.md', '_bmad-output/project-context.md',
    'docs/prd.md', 'docs/front-end-spec.md', 'docs/ux/mobile-ia.md', 'docs/tech-spec-epic-2.md',
    sprintPath, migrationPath, `${impl}/sprint-migration-2026-09-15.md`,
    `${planning}/implementation-readiness-sp-handoff-2026-09-15.md`,
    migration.snapshot.directory, migration.retrospective_scope['epic-1-retrospective'].evidence,
    migration.deferred_registry,
  ]);
  for (const entry of Object.values(migration.story_catalog)) {
    if (existsSync(resolve(root, entry.implementation_file))) paths.add(entry.implementation_file);
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
  return directory;
}

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
    (s) => { delete s.execution_pauses[key('3.1')]; }), /Cannot resume 3.1 before its upstream prerequisites/],
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
