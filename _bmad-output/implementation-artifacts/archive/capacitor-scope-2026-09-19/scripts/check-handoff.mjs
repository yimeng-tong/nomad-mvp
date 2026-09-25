import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { checkSprintDelivery, nextStoryToPrepare } from './check-sprint-delivery.mjs';

const IMPLEMENTATION = '_bmad-output/implementation-artifacts';
const PLANNING = '_bmad-output/planning-artifacts';
const BASELINE = '10f940c49e2d61ddcb1233cffddd071ed1c9284c';
const LEGACY_EDIT = '2-2-timeline-editing-undo-and-history';
const BRANCH = 'codex/story-2-2-timeline-editing';
const CONDITION_OWNERS = {
  'OPS-01': '1.0', 'OPS-02': '1.9', 'DB-CHANGE-01': '1.0',
  'DATA-VECTOR-01': '2.13', 'METRICS-01': '1.0', 'METRICS-02': '8.1', 'METRICS-03': '8.2',
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const equalSet = (actual, expected, message) => assert.deepEqual([...actual].sort(), [...expected].sort(), message);
const mapping = (value, label) => {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be a mapping`);
  return value;
};
// js-yaml rejects duplicate mapping keys by default. JSON_SCHEMA keeps dates as strings.
const parseYaml = (text, label) => mapping(yaml.load(text, { schema: yaml.JSON_SCHEMA, filename: label }), label);
const frontMatter = (text, label) => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(match, `${label} needs YAML front matter`);
  return parseYaml(match[1], label);
};
const withoutFrontMatter = (text) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

export function checkHandoff(root = process.cwd()) {
  const base = resolve(root);
  const checkedPath = (path) => {
    assert.equal(typeof path, 'string', 'Referenced path must be a string');
    const absolute = resolve(base, path);
    assert.ok(absolute.startsWith(`${base}${sep}`), `Referenced path must remain in the repository: ${path}`);
    return absolute;
  };
  const read = (path) => readFileSync(checkedPath(path), 'utf8');
  const exists = (path) => existsSync(checkedPath(path));
  const readYaml = (path) => parseYaml(read(path), path);
  const currentText = read('CURRENT.md');
  const current = frontMatter(currentText, 'CURRENT.md');
  const sprint = readYaml(current.tracking_system);
  const migration = readYaml(sprint.migration_manifest);
  const epicsText = read(sprint.epics_source);
  const epicsMeta = frontMatter(epicsText, sprint.epics_source);
  const context = read('_bmad-output/project-context.md');

  assert.equal(current.project, 'nomad-mvp');
  assert.equal(sprint.project, current.project);
  assert.equal(migration.project, current.project);
  assert.equal(migration.schema_version, 1);
  assert.equal(current.tracking_system, `${IMPLEMENTATION}/sprint-status.yaml`);
  assert.equal(sprint.story_location, IMPLEMENTATION);
  assert.equal(sprint.tracking_system, 'file-system');
  assert.equal(sprint.project_key, 'NOKEY');
  assert.equal(sprint.epics_source, `${PLANNING}/epics.md`, 'Only the formal epics file supplies executable stories');
  assert.equal(migration.authoritative_epics, sprint.epics_source);
  assert.equal(current.migration_manifest, sprint.migration_manifest);
  assert.equal(current.migration_report, sprint.migration_report);
  assert.equal(current.planning_status, 'bmad-sprint-planning-complete');
  assert.equal(sprint.planning_status, 'sprint-planning-complete');
  assert.equal(current.sprint_planning_completed, true);
  assert.ok(typeof current.working_branch === 'string' && current.working_branch.length, 'Record the current working branch; the migration preserves the legacy branch separately');
  const sprintText = read(current.tracking_system);
  for (const key of ['generated', 'last_updated', 'project', 'project_key', 'tracking_system', 'story_location']) {
    assert.ok(sprintText.includes(`# ${key}: ${sprint[key]}\n`), `BMAD metadata comment missing: ${key}`);
  }

  // CE/IR checks now verify the preserved readiness input, not the obsolete live queue.
  assert.ok(epicsMeta.stepsCompleted.includes('step-04-final-validation'));
  assert.equal(epicsMeta.finalValidationStatus, 'passed');
  assert.equal(epicsMeta.workflowStatus, 'completed');
  assert.equal(epicsMeta.workflowCompletionConfirmed, true);
  const readinessText = read(current.readiness_report);
  const readiness = frontMatter(readinessText, current.readiness_report);
  assert.equal(readiness.status, 'passed-targeted-revalidation');
  assert.equal(readiness.readinessVerdict, 'READY');
  assert.equal(readiness.readinessScope, 'sprint-planning');
  assert.deepEqual(readiness.openFindings, []);
  assert.equal(readiness.productionReady, false);
  assert.equal(readiness.sprintPlanningStarted, false, 'Keep the pre-SP report as a dated snapshot');
  assert.equal(readiness.implementationAuthorized, false);
  assert.equal(current.prompt_strength_status, 'approved-applied-and-revalidated');
  assert.ok(exists(current.prompt_strength_record));
  for (const match of readinessText.matchAll(/^\| `([^`]+)` \| `([a-f0-9]{64})` \|$/gm)) {
    assert.equal(sha256(read(match[1])), match[2], `Approved planning input changed: ${match[1]}`);
  }
  assert.equal(migration.epics_sha256, sha256(epicsText), 'Migration inventory must match the approved full epics file');

  // Parse the whole document, using only formal level-two Epic / level-three Story headings.
  const headings = [...epicsText.matchAll(/^## Epic (\d+): (.+)$|^### Story (\d+\.\d+): (.+)$/gm)];
  const epics = [];
  const stories = [];
  let activeEpic;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (heading[1]) {
      activeEpic = Number(heading[1]);
      epics.push(activeEpic);
      continue;
    }
    const id = heading[3];
    assert.equal(Number(id.split('.')[0]), activeEpic, `Story ${id} is under the wrong Epic`);
    const body = epicsText.slice(heading.index, headings[i + 1]?.index ?? epicsText.length);
    const counts = ['Given', 'When', 'Then'].map((word) => [...body.matchAll(new RegExp(`^\\*\\*${word}\\*\\*`, 'gm'))].length);
    assert.ok(counts[0] > 0 && counts.every((n) => n === counts[0]), `Malformed GWT contract: ${id}`);
    for (const pattern of [/^As a /m, /^I want /m, /^So that /im, /^\*\*Requirements:\*\*/m]) {
      assert.match(body, pattern, `Story ${id} lacks its approved narrative/requirements`);
    }
    stories.push({ id, title: heading[4], epic: activeEpic, gwt: counts[0], hash: sha256(body) });
  }
  assert.deepEqual(epics, [1, 2, 3, 4, 5, 6, 7, 8], 'Each formal Epic appears exactly once');
  assert.equal(stories.length, 60);
  assert.equal(new Set(stories.map((s) => s.id)).size, 60, 'Duplicate formal Story ID');
  const gwt = stories.reduce((sum, s) => sum + s.gwt, 0);
  const fr = [...epicsText.matchAll(/^- (FR[\d.]+(?:-lite)?):/gm)].map((m) => m[1]);
  const nfr = [...epicsText.matchAll(/^- (NFR\d+):/gm)].map((m) => m[1]);
  assert.equal(gwt, 1018);
  assert.equal(fr.length, 65);
  assert.equal(new Set(fr).size, fr.length);
  assert.equal(nfr.length, 24);
  assert.equal(new Set(nfr).size, nfr.length);
  assert.equal(readiness.storyCount, stories.length);
  assert.equal(readiness.gwtScenarioCount, gwt);
  assert.deepEqual(migration.scope_counts, {
    epics: 8, stories: 60, historical_stories: 7, current_target_stories: 53, gwt_scenarios: 1018,
    functional_requirements: 65, mvp_functional_requirements: 61,
    deferred_functional_requirements: 4, nonfunctional_requirements: 24,
  });

  const catalog = mapping(migration.story_catalog, 'story_catalog');
  const status = mapping(sprint.development_status, 'development_status');
  const keys = Object.keys(catalog);
  const byId = Object.fromEntries(keys.map((key) => [catalog[key].story_id, key]));
  equalSet(Object.keys(byId), stories.map((s) => s.id), 'Catalog must cover exactly the formal Story IDs');
  assert.equal(keys.length, stories.length, 'No duplicate Story identity under another slug');
  assert.deepEqual(keys.map((key) => catalog[key].story_id), stories.map((s) => s.id), 'Keep the formal source order');
  for (const story of stories) {
    const key = byId[story.id];
    const entry = catalog[key];
    assert.match(key, /^\d+-\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/, `Invalid stable slug: ${key}`);
    assert.ok(key.startsWith(`${story.id.replace('.', '-')}-`), `Slug ID mismatch: ${key}`);
    assert.equal(entry.title, story.title, `Title mismatch: ${key}`);
    assert.equal(entry.gwt_scenarios, story.gwt, `GWT mismatch: ${key}`);
    assert.equal(entry.contract_sha256, story.hash, `Current contract mismatch: ${key}`);
    assert.equal(entry.implementation_file, `${IMPLEMENTATION}/${key}.md`);
    assert.ok(['historical', 'current-target'].includes(entry.scope), `Unknown scope: ${key}`);
  }
  const expectedKeys = epics.flatMap((epic) => [
    `epic-${epic}`, ...stories.filter((s) => s.epic === epic).map((s) => byId[s.id]), `epic-${epic}-retrospective`,
  ]);
  assert.deepEqual(Object.keys(status), expectedKeys, 'Sprint must contain exactly 8 Epics, 60 Stories and 8 retrospectives in order');
  const storyStates = ['backlog', 'ready-for-dev', 'in-progress', 'review', 'done'];
  for (const [key, value] of Object.entries(status)) {
    const allowed = /^epic-\d+-retrospective$/.test(key) ? ['optional', 'done']
      : /^epic-\d+$/.test(key) ? ['backlog', 'in-progress', 'done'] : storyStates;
    assert.ok(allowed.includes(value), `Illegal development_status value ${key}: ${value}`);
  }
  for (const epic of epics) {
    const childStates = stories.filter((s) => s.epic === epic).map((s) => status[byId[s.id]]);
    if (status[`epic-${epic}`] === 'done') {
      assert.ok(childStates.every((s) => s === 'done'), `Expanded Epic ${epic} cannot inherit historical done`);
    } else if (childStates.some((s) => s !== 'backlog')) {
      assert.equal(status[`epic-${epic}`], 'in-progress', `Epic ${epic} has delivered or started work`);
    }
  }

  // Original file bytes and state are independently checked; they are never used as the live queue.
  const snapshot = readYaml(migration.snapshot.legacy_sprint);
  assert.ok(exists(migration.snapshot.scope_note));
  const snapshots = JSON.parse(read(migration.snapshot.manifest));
  for (const [name, entry] of Object.entries(snapshots)) {
    assert.equal(sha256(read(`${migration.snapshot.directory}/${name}`)), entry.sha256, `Historical snapshot changed: ${name}`);
  }
  const oldStatus = snapshot.development_status;
  const oldStoryKeys = Object.keys(oldStatus).filter((key) => /^\d+-\d+-/.test(key));
  assert.equal(oldStoryKeys.length, 14);
  const historical = oldStoryKeys.filter((key) => oldStatus[key] === 'done');
  assert.equal(historical.length, 7);
  assert.equal(oldStatus['epic-1'], 'done');
  assert.equal(oldStatus['epic-1-retrospective'], 'done');
  assert.equal(oldStatus[LEGACY_EDIT], 'in-progress');
  assert.equal(oldStatus['2-3-feasibility-validation-and-one-click-fixes'], 'backlog');
  const legacyMappings = mapping(migration.legacy_story_mappings, 'legacy_story_mappings');
  equalSet(Object.keys(legacyMappings), oldStoryKeys, 'Every legacy Story must have an explicit disposition');
  for (const key of historical) {
    assert.equal(status[key], 'done', `Historical done must be preserved: ${key}`);
    assert.equal(catalog[key].scope, 'historical');
    const text = read(catalog[key].implementation_file);
    assert.match(text, /^Status: done$/m, `Historical implementation must remain done: ${key}`);
    assert.equal(sha256(text), catalog[key].historical_file_sha256, `Historical implementation changed: ${key}`);
    assert.deepEqual(legacyMappings[key].current_story_keys, [key]);
    assert.equal(legacyMappings[key].disposition, 'preserved-historical');
    assert.equal(legacyMappings[key].inherit_status, true);
  }
  equalSet(keys.filter((key) => catalog[key].scope === 'historical'), historical, 'No target may masquerade as historical');
  const targets = keys.filter((key) => !historical.includes(key));
  assert.equal(targets.length, 53);
  equalSet(Object.keys(migration.implementation_conditions), Object.keys(CONDITION_OWNERS), 'Keep all seven engineering conditions, without extra product Stories');
  if (sprint.execution_phase === 'planning-handoff') {
    for (const key of targets) assert.ok(!exists(catalog[key].implementation_file), 'This SP checkpoint must not create implementation Stories');
  }
  const delivery = checkSprintDelivery({ current, sprint, migration, targets, byId, read, exists });
  assert.deepEqual(migration.preparation_order, targets, 'Preparation order skips historical completed work');
  const superseded = {
    '2-3-feasibility-validation-and-one-click-fixes': ['3.4'],
    '2-4-export-itinerary-png': ['5.4', '5.5'],
    '3-1-one-shot-ai-fill-result-sheet-and-citations': ['5.1', '5.2', '5.3'],
    '3-2-observability-evaluation-and-provider-routing': ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6'],
    '3-3-account-privacy-quota-and-compliance-controls': ['1.0', '7.3', '7.4', '7.5', '7.6', '8.4'],
    '3-4-recent-trips-and-check-in-state': ['7.1'],
  };
  for (const [key, ids] of Object.entries(superseded)) {
    const item = legacyMappings[key];
    assert.deepEqual(item.current_story_keys, ids.map((id) => byId[id]), `Incorrect legacy successor: ${key}`);
    assert.equal(item.previous_status, oldStatus[key]);
    assert.equal(item.disposition, 'superseded-scope');
    assert.equal(item.inherit_status, false, `Superseded scope cannot transfer readiness: ${key}`);
    assert.ok(!Object.hasOwn(status, key), `Old and new identities cannot both be dispatched: ${key}`);
  }
  const editKey = byId['3.1'];
  assert.equal(editKey, '3-1-minute-timeline-editing-and-plan-wide-undo');
  const editMigration = legacyMappings[LEGACY_EDIT];
  assert.deepEqual(editMigration.current_story_keys, [editKey], 'Legacy 2.2 must have exactly one execution identity');
  assert.equal(editMigration.legacy_story_id, LEGACY_EDIT);
  assert.equal(editMigration.baseline_commit, BASELINE);
  assert.equal(editMigration.working_branch, BRANCH);
  assert.equal(editMigration.inherit_status, true);
  assert.equal(editMigration.disposition, 'migrated-in-progress');
  assert.equal(editMigration.previous_status, oldStatus[LEGACY_EDIT]);
  assert.ok(['in-progress', 'review', 'done'].includes(status[editKey]), 'Preserve inherited work separately from contract preparation');
  assert.ok(!Object.hasOwn(status, LEGACY_EDIT), 'Legacy 2.2 must not remain a second execution identity');
  const legacyStory = read(editMigration.legacy_file);
  const legacyMeta = frontMatter(legacyStory, editMigration.legacy_file);
  assert.equal(legacyMeta.baseline_commit, BASELINE);
  assert.equal(legacyMeta.tracking_role, 'legacy-source-only');
  assert.equal(legacyMeta.status_scope, 'pre-sprint-migration-history');
  assert.equal(legacyMeta.canonical_story_key, editKey);
  assert.equal(legacyMeta.dispatchable, false);
  assert.equal(legacyMeta.migration_manifest, sprint.migration_manifest);
  assert.match(legacyStory, /^Status: in-progress$/m);
  assert.equal(withoutFrontMatter(legacyStory), withoutFrontMatter(read(`${migration.snapshot.directory}/legacy-2-2.before.md`)), 'Keep the original legacy body and outstanding evidence');
  const editContract = migration.paused_story_contract;
  assert.equal(editContract.story_key, editKey);
  assert.equal(editContract.legacy_story_id, LEGACY_EDIT);
  assert.equal(editContract.baseline_commit, BASELINE);
  assert.equal(editContract.working_branch, BRANCH);
  equalSet(editContract.start_after, ['1.0', '2.7', '2.9', '2.10', '2.11'].map((id) => byId[id]), 'Editing must retain its actual upstream prerequisites');
  assert.ok(!editContract.start_after.some((key) => editContract.not_prerequisites.includes(key)), 'No circular or future-feature gate for 3.1');
  const pauses = mapping(sprint.execution_pauses, 'execution_pauses');
  for (const key of Object.keys(pauses)) assert.ok(targets.includes(key), `Pause for an unknown Story: ${key}`);
  const pause = pauses[editKey];
  if (current.paused_story !== null) assert.equal(pauses[current.paused_story]?.paused, true, 'CURRENT pause pointer must refer to a paused Story');
  if (pause?.paused) {
    assert.equal(current.paused_story, editKey);
    assert.equal(pause.legacy_story_id, LEGACY_EDIT);
    assert.equal(pause.baseline_commit, BASELINE);
    assert.equal(pause.working_branch, BRANCH);
    assert.deepEqual(pause.start_after, editContract.start_after);
    assert.equal(status[editKey], 'in-progress');
    assert.ok(pause.reason);
    if (!exists(catalog[editKey].implementation_file)) assert.equal(pause.contract_ready, false, 'Missing current contract cannot be ready');
  } else {
    assert.ok(editContract.start_after.every((key) => status[key] === 'done'), 'Cannot resume 3.1 before its upstream prerequisites');
    if (pause) assert.equal(pause.contract_ready, true, 'Resumed 3.1 must have a prepared current contract');
    assert.ok(exists(catalog[editKey].implementation_file), 'Resumed 3.1 needs its own current contract');
    const prepared = frontMatter(read(catalog[editKey].implementation_file), editKey);
    assert.equal(prepared.migration_audit_complete, true, 'Resumed 3.1 needs the keep/change/remove audit');
    assert.ok(exists(prepared.migration_audit_evidence), 'Migration audit evidence is required');
    if (current.current_story === editKey) assert.equal(current.working_branch, BRANCH, 'Resume migrated editing on its preserved branch/history');
  }
  for (const key of targets) {
    const file = catalog[key].implementation_file;
    const inheritedUnprepared = key === editKey && pause?.paused && pause.contract_ready === false;
    if (status[key] !== 'backlog' && !inheritedUnprepared) {
      assert.ok(exists(file), `Advanced Story requires its current implementation file: ${key}`);
      const storyText = read(file);
      assert.match(storyText, new RegExp(`^Status: ${status[key]}$`, 'm'), `Implementation status mismatch: ${key}`);
      const meta = frontMatter(storyText, file);
      assert.equal(meta.source_story_id, catalog[key].story_id, `Prepared Story must identify its current source: ${key}`);
      assert.equal(meta.source_contract_sha256, catalog[key].contract_sha256, `Prepared Story must pin its approved contract: ${key}`);
      assert.ok(storyText.includes(sprint.delivery_contract), `Prepared Story must carry the delivery contract: ${key}`);
      for (const id of migration.story_condition_bindings[key]) assert.ok(storyText.includes(id), `Prepared Story must carry ${id}: ${key}`);
      for (const id of delivery.story_requirement_bindings[key]) assert.ok(storyText.includes(id), `Prepared Story must carry ${id}: ${key}`);
      for (const [id, obligation] of Object.entries(delivery.source_obligations)) {
        if (obligation.story_keys.includes(key)) assert.ok(storyText.includes(id), `Prepared Story must carry source obligation ${id}: ${key}`);
      }
      if (key === editKey) {
        const meta = frontMatter(storyText, file);
        assert.equal(meta.legacy_story_id, LEGACY_EDIT);
        assert.equal(meta.baseline_commit, BASELINE);
      }
    }
  }
  for (const name of readdirSync(checkedPath(IMPLEMENTATION))) {
    if (!/^\d+-\d+-.+\.md$/.test(name) || name.endsWith('-validation.md')) continue;
    const key = name.slice(0, -3);
    if (keys.includes(key) || key === LEGACY_EDIT) continue;
    assert.doesNotMatch(read(`${IMPLEMENTATION}/${name}`), /^Status: (?:ready-for-dev|in-progress|review)$/m, `Unmapped draft cannot be dispatched: ${key}`);
  }

  const retrospective = migration.retrospective_scope['epic-1-retrospective'];
  const liveRetrospective = sprint.retrospective_scope['epic-1-retrospective'];
  for (const field of ['completed_scope', 'evidence', 'evidence_sha256', 'completed_story_keys', 'additional_scope_story_keys']) {
    assert.deepEqual(liveRetrospective[field], retrospective[field], 'Historical retrospective facts cannot change');
  }
  if (liveRetrospective.expanded_scope_review_required === false) {
    assert.equal(status['epic-1'], 'done', 'Expanded retrospective cannot close before the expanded Epic');
    assert.ok(exists(liveRetrospective.expanded_scope_evidence), 'Expanded retrospective needs new evidence');
    equalSet(liveRetrospective.expanded_scope_story_keys, keys.filter((key) => key.startsWith('1-')), 'Expanded retrospective must cover the full current Epic');
  } else assert.equal(liveRetrospective.expanded_scope_review_required, true);
  assert.equal(status['epic-1-retrospective'], 'done', 'Keep the completed historical retrospective');
  equalSet(retrospective.completed_story_keys, historical.filter((key) => key.startsWith('1-')));
  equalSet(retrospective.additional_scope_story_keys, targets.filter((key) => key.startsWith('1-')));
  assert.equal(retrospective.expanded_scope_review_required, true);
  assert.equal(sha256(read(retrospective.evidence)), retrospective.evidence_sha256, 'Preserve the historical retrospective evidence');

  const conditions = mapping(migration.implementation_conditions, 'implementation_conditions');
  const bindings = mapping(migration.story_condition_bindings, 'story_condition_bindings');
  equalSet(Object.keys(bindings), targets, 'Every current target needs an explicit condition binding');
  for (const [id, condition] of Object.entries(conditions)) {
    assert.equal(condition.primary_story, byId[CONDITION_OWNERS[id]], `Incorrect first owner for ${id}`);
    assert.equal(condition.delivery_assignee, 'Codex', `${id} needs the named project executor`);
    assert.equal(condition.verification_assignee, 'Codex', `${id} needs a named verification owner`);
    assert.equal(condition.source, `${PLANNING}/implementation-prerequisites-2026-09-15.md`);
    assert.ok(read(condition.source).includes(`## ${condition.source_section}`), `Missing approved condition source: ${id}`);
    assert.ok(condition.trigger && condition.start_conditions.length && condition.close_conditions.length, `Incomplete start/close contract: ${id}`);
    assert.equal(condition.execution_state, 'not-started', 'Preserve the migration-time condition snapshot; live progress belongs in sprint-status');
    assert.ok(condition.applies_to.includes(condition.primary_story));
    assert.equal(new Set(condition.applies_to).size, condition.applies_to.length);
    assert.ok(condition.applies_to.every((key) => targets.includes(key)), `Condition ${id} refers to an unknown/historical Story`);
  }
  for (const key of targets) {
    equalSet(bindings[key], Object.keys(conditions).filter((id) => conditions[id].applies_to.includes(key)), `Condition bindings drifted: ${key}`);
  }
  assert.equal(conditions['METRICS-02'].decision_assignee, 'yimeng-tong');
  assert.equal(conditions['METRICS-03'].human_evaluation_assignee, 'yimeng-tong');
  assert.ok(conditions['DATA-VECTOR-01'].extension_rule, 'Vector work must follow the first actual consumer');
  for (const id of ['1.0', '1.6', '1.7', '1.9']) assert.ok(bindings[byId[id]].includes('METRICS-01'), `Early measurement missing for ${id}`);
  for (const id of ['1.9', '1.10', '5.4', '5.5', '7.4', '7.5', '7.6']) assert.ok(bindings[byId[id]].includes('OPS-02'), `Object lifecycle missing for ${id}`);
  assert.deepEqual(migration.deferred_story_ids, ['7.2', '8.7', '8.8']);
  assert.deepEqual(migration.deferred_requirements, ['FR34.1', 'FR40.1', 'FR42', 'FR43']);
  for (const id of migration.deferred_story_ids) assert.ok(!Object.hasOwn(byId, id), `Deferred Story is executable: ${id}`);
  assert.ok(exists(migration.deferred_registry));
  for (const item of migration.excluded_nonexecutables) {
    assert.ok(exists(item.path), `Missing preserved draft/source: ${item.path}`);
    assert.ok(item.reason);
  }

  const progress = mapping(sprint.condition_progress, 'condition_progress');
  for (const [key, items] of Object.entries(progress)) {
    assert.ok(targets.includes(key), `Unknown condition-progress Story: ${key}`);
    for (const [id, item] of Object.entries(mapping(items, key))) {
      assert.ok(bindings[key].includes(id), `Unbound condition progress: ${key}/${id}`);
      assert.ok(['not-started', 'in-progress', 'verified', 'not-applicable'].includes(item.state), `Illegal condition progress: ${key}/${id}`);
      if (['verified', 'not-applicable'].includes(item.state)) {
        assert.ok(item.summary && Array.isArray(item.evidence) && item.evidence.length && item.evidence.every(exists), `Condition ${key}/${id} needs scoped evidence`);
      }
    }
  }
  const originalAuthorization = { sprint_planning: true, create_story: false, implementation: false, real_services: false, deployment: false, data_operations: false };
  assert.deepEqual(migration.authorization, originalAuthorization, 'Keep the original SP authorization snapshot');
  equalSet(Object.keys(sprint.authorization), Object.keys(originalAuthorization), 'Live authorization fields must remain explicit');
  for (const value of Object.values(sprint.authorization)) assert.equal(typeof value, 'boolean');
  assert.equal(current.sprint_planning_authorized, true);
  assert.equal(sprint.authorization.sprint_planning, true);
  assert.equal(current.create_story_authorized, sprint.authorization.create_story);
  assert.equal(current.implementation_authorized, sprint.authorization.implementation);
  assert.equal(current.execution_phase, sprint.execution_phase);
  assert.ok(['planning-handoff', 'execution'].includes(sprint.execution_phase));
  const nextPreparation = nextStoryToPrepare(migration, status, exists, pauses);
  assert.equal(sprint.next_story_to_prepare, nextPreparation, 'Next preparation must include the inherited unprepared 3.1 contract');
  if (current.current_story !== null) {
    assert.ok(targets.includes(current.current_story), 'CURRENT must select a current target');
    assert.equal(current.current_epic, Number(catalog[current.current_story].story_id.split('.')[0]));
    assert.equal(current.current_story_status, status[current.current_story]);
    const activeFile = catalog[current.current_story].implementation_file;
    assert.equal(current.current_story_file, exists(activeFile) ? activeFile : null);
    const actions = {
      backlog: ['bmad-create-story'], 'ready-for-dev': ['bmad-dev-story'],
      'in-progress': ['bmad-dev-story', 'bmad-code-review'], review: ['bmad-code-review'],
      done: ['bmad-create-story', 'bmad-sprint-status', 'bmad-retrospective'],
    };
    if (pauses[current.current_story]?.paused) {
      actions['in-progress'] = pauses[current.current_story].contract_ready === false ? ['bmad-create-story'] : ['bmad-sprint-status'];
    }
    assert.ok(actions[current.current_story_status].includes(current.next_bmad_action), 'Next action must match contract readiness and Story state');
  } else {
    assert.ok(targets.every((key) => status[key] === 'done'), 'Only a completed queue may clear CURRENT');
    assert.equal(current.current_epic, null);
    assert.equal(current.current_story_file, null);
    assert.ok(['bmad-retrospective', 'bmad-sprint-status'].includes(current.next_bmad_action));
  }
  assert.equal(current.current_story_spec, sprint.epics_source);
  assert.equal(status[current.last_completed_story], 'done', 'The last completed pointer must refer to completed work');
  if (sprint.execution_phase === 'planning-handoff') {
    assert.deepEqual(sprint.authorization, originalAuthorization, 'SP revalidation grants no implementation authorization');
    assert.equal(current.current_story, byId['1.0'], 'First new preparation must be production authentication');
    assert.equal(current.current_story_status, 'backlog');
    assert.equal(current.next_bmad_checkpoint, 'await-story-1-0-preparation-authorization');
    assert.equal(current.handoff_status, 'sprint-planning-complete-awaiting-next-authorization');
    assert.deepEqual(progress, {}, 'SP revalidation does not execute implementation conditions');
  }
  const report = frontMatter(read(sprint.migration_report), sprint.migration_report);
  assert.equal(report.workflow, 'bmad-sprint-planning');
  assert.equal(report.implementation_started, false);
  assert.equal(report.status, 'completed', 'The SP completion record must be finalized');

  for (const [name, text] of [['README.md', read('README.md')], ['AGENTS.md', read('AGENTS.md')], ['project-context.md', context]]) {
    assert.match(text, /CURRENT\.md/, `${name} must link to CURRENT.md`);
  }
  for (const [name, text] of [['README.md', read('README.md')], ['AGENTS.md', read('AGENTS.md')], ['CURRENT.md', currentText]]) {
    assert.doesNotMatch(text, /docs\/stories\//, `${name} must not point at the legacy story path`);
  }
  // Retain the previous semantic safety checks as well as the new migration checks.
  const currentPlanningFiles = [
    'docs/prd.md', 'docs/front-end-spec.md', 'docs/ux/mobile-ia.md', 'docs/tech-spec-epic-2.md',
    `${PLANNING}/prd.md`, `${PLANNING}/epics.md`, `${PLANNING}/ux.md`, `${PLANNING}/supporting-tech-specs.md`,
  ];
  const stalePatterns = [
    /移除\/必去 must_go/, /主按钮[^\n]*[：“"](?:下一步\/)?生成骨架/, /已选 N [|｜/] 生成骨架/,
    /酒店槽[^\n]*不提供[“"]留空/, /酒店\/早餐、换酒店行李处理、预约\/门票/,
  ];
  for (const path of currentPlanningFiles) {
    for (const pattern of stalePatterns) assert.doesNotMatch(read(path), pattern, `${path} contains stale Epic 2 semantics: ${pattern}`);
  }
  assert.equal(read('docs/prd.md'), read(`${PLANNING}/prd.md`), 'PRD mirror must remain byte-identical');
  return {
    epics: epics.length, stories: stories.length, retrospectives: epics.length, gwt,
    epicsInProgress: epics.filter((id) => status[`epic-${id}`] === 'in-progress').length,
    done: keys.filter((key) => status[key] === 'done').length,
    inProgress: keys.filter((key) => status[key] === 'in-progress').length,
    backlog: keys.filter((key) => status[key] === 'backlog').length,
    ready: keys.filter((key) => status[key] === 'ready-for-dev').length,
    next: sprint.next_story_to_prepare,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('BMAD handoff check passed:', JSON.stringify(checkHandoff()));
}
