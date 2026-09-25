import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import yaml from 'js-yaml';

const hash = (text) => createHash('sha256').update(text).digest('hex');
const equalSet = (a, b, message) => assert.deepEqual([...a].sort(), [...b].sort(), message);

export function requirementInventory(text) {
  const matches = [...text.matchAll(/^- ((?:N?FR)[\d.]+(?:-lite)?): (.+)$/gm)];
  return Object.fromEntries(matches.map((match, i) => {
    let end = matches[i + 1]?.index ?? text.length;
    const section = text.slice(match.index + match[0].length, end).search(/^#{2,} /m);
    if (section >= 0) end = match.index + match[0].length + section;
    return [match[1], {
      source_line: text.slice(0, match.index).split('\n').length,
      source_sha256: hash(text.slice(match.index, end).trimEnd()),
    }];
  }));
}

export function checkSprintDelivery({ current, sprint, migration, targets, byId, read, exists }) {
  assert.equal(current.delivery_contract, sprint.delivery_contract);
  assert.equal(current.revalidation_report, sprint.revalidation_report);
  const delivery = yaml.load(read(sprint.delivery_contract), { schema: yaml.JSON_SCHEMA });
  assert.equal(delivery.schema_version, 1);
  assert.equal(delivery.project, sprint.project);
  assert.equal(delivery.migration_manifest, sprint.migration_manifest);
  assert.equal(delivery.review_report, sprint.revalidation_report);
  assert.equal(delivery.prd_source, 'docs/prd.md');
  assert.equal(delivery.epics_source, sprint.epics_source);
  assert.equal(delivery.prd_sha256, hash(read(delivery.prd_source)));
  const inventory = requirementInventory(read(delivery.prd_source));
  equalSet(Object.keys(inventory), Object.keys(requirementInventory(read(delivery.epics_source))), 'PRD and Epics requirement IDs must agree');
  equalSet(Object.keys(delivery.requirements), Object.keys(inventory), 'Every PRD FR/NFR needs an explicit delivery disposition');
  const deferred = migration.deferred_requirements;
  for (const [id, entry] of Object.entries(delivery.requirements)) {
    assert.equal(entry.source_line, inventory[id].source_line, `${id} source location drifted`);
    assert.equal(entry.source_sha256, inventory[id].source_sha256, `${id} source contract drifted`);
    assert.equal(entry.scope, deferred.includes(id) ? 'deferred' : 'mvp', `Incorrect scope for ${id}`);
    assert.equal(new Set(entry.delivery_story_keys).size, entry.delivery_story_keys.length, `Duplicate delivery owner: ${id}`);
    assert.ok(entry.delivery_story_keys.every((key) => targets.includes(key)), `${id} cannot be fulfilled by a historical/unknown Story`);
    assert.ok(entry.engineering_conditions.every((key) => key in migration.implementation_conditions), `Unknown condition: ${id}`);
    if (entry.scope === 'deferred') {
      assert.deepEqual(entry.delivery_story_keys, [], `Deferred ${id} cannot enter execution`);
      assert.ok(entry.deferred_story_ids.every((storyId) => migration.deferred_story_ids.includes(storyId)), `Unapproved deferred Story identity: ${id}`);
    }
    else assert.ok(entry.delivery_story_keys.length, `Unassigned MVP requirement: ${id}`);
  }
  assert.deepEqual(delivery.requirements['FR40.1'].deferred_story_ids, [], 'Future photo memories must not inherit the manual 7.2 contract');
  equalSet(Object.keys(delivery.story_requirement_bindings), targets, 'Every target Story needs a requirement binding');
  for (const key of targets) {
    equalSet(delivery.story_requirement_bindings[key], Object.keys(inventory).filter((id) => delivery.requirements[id].delivery_story_keys.includes(key)), `Requirement binding mismatch: ${key}`);
    assert.ok(delivery.story_requirement_bindings[key].length, `Untraced target Story: ${key}`);
  }
  // These clauses are easy to lose when counting labels instead of checking actual delivery slices.
  for (const [id, storyIds] of Object.entries({ FR9: ['2.11', '3.1', '3.4'], NFR19: ['2.7'], NFR7: ['1.0', '2.7', '7.4', '7.5'], FR37: ['5.1', '5.2', '5.3'], NFR24: ['8.5'] })) {
    for (const storyId of storyIds) assert.ok(delivery.requirements[id].delivery_story_keys.includes(byId[storyId]), `${id} needs its actual first delivery in ${storyId}`);
  }
  const expectedObligations = { 'login-attribution': '1.0', 'input-attribution': '1.6', 'analytics-consolidation': '8.1', 'map-copyright': '2.7' };
  equalSet(Object.keys(delivery.source_obligations), Object.keys(expectedObligations), 'Keep the PRD subclause obligations');
  for (const [name, item] of Object.entries(delivery.source_obligations)) {
    assert.deepEqual(item.story_keys, [byId[expectedObligations[name]]], `Wrong first-use owner: ${name}`);
    assert.ok(item.requirements.length && item.requirements.every((id) => id in inventory));
    assert.ok(read(item.source).includes(item.source_heading), `Missing source obligation: ${name}`);
    assert.ok(item.task && item.evidence, `Incomplete implementation handoff: ${name}`);
  }
  assert.ok(exists(delivery.review_report));
  return delivery;
}

export function nextStoryToPrepare(migration, status, exists, pauses) {
  return migration.preparation_order.find((key) => {
    if (status[key] === 'backlog') return true;
    if (pauses[key]?.contract_ready === false) return true;
    return !exists(migration.story_catalog[key].implementation_file);
  }) ?? null;
}
