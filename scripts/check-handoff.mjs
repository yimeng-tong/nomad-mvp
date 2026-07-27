import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const current = read('CURRENT.md');
const readme = read('README.md');
const agents = read('AGENTS.md');
const context = read('_bmad-output/project-context.md');
const sprint = read('_bmad-output/implementation-artifacts/sprint-status.yaml');
const story20 = read('_bmad-output/implementation-artifacts/2-0-confirm-and-planner-picker.md');
const story21 = read('_bmad-output/implementation-artifacts/2-1-generate-day-skeleton-with-quick-and-hq-planning.md');
const story22 = read('_bmad-output/implementation-artifacts/2-2-timeline-editing-undo-and-history.md');

assert.match(current, /^current_epic: 2$/m);
assert.match(current, /^last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning$/m);
assert.match(current, /^current_story: 2-2-timeline-editing-undo-and-history$/m);
assert.match(current, /^current_story_status: (in-progress|review)$/m);
assert.match(current, /^next_bmad_action: (bmad-dev-story|bmad-code-review)$/m);

for (const [name, text] of [
  ['README.md', readme],
  ['AGENTS.md', agents],
  ['project-context.md', context],
]) {
  assert.match(text, /CURRENT\.md/, `${name} must link to CURRENT.md`);
}

for (const [name, text] of [
  ['README.md', readme],
  ['AGENTS.md', agents],
  ['CURRENT.md', current],
]) {
  assert.doesNotMatch(text, /docs\/stories\//, `${name} must not point at the legacy story path`);
}

assert.match(story20, /^Status: done$/m);
assert.match(story21, /^Status: done$/m);
assert.match(story22, /^Status: (in-progress|review)$/m);
assert.match(story22, /^baseline_commit: [0-9a-f]{40}$/m);
assert.match(sprint, /^\s+2-0-confirm-and-planner-picker: done$/m);
assert.match(sprint, /^\s+2-1-generate-day-skeleton-with-quick-and-hq-planning: done$/m);
assert.match(sprint, /^\s+2-2-timeline-editing-undo-and-history: (in-progress|review)$/m);
assert.match(sprint, /^\s+2-3-feasibility-validation-and-one-click-fixes: backlog$/m);

const currentPlanningFiles = [
  'docs/prd.md',
  'docs/front-end-spec.md',
  'docs/ux/mobile-ia.md',
  'docs/tech-spec-epic-2.md',
  '_bmad-output/planning-artifacts/prd.md',
  '_bmad-output/planning-artifacts/epics.md',
  '_bmad-output/planning-artifacts/ux.md',
  '_bmad-output/planning-artifacts/supporting-tech-specs.md',
];
const stalePatterns = [
  /移除\/必去 must_go/,
  /主按钮[^\n]*[：“"](?:下一步\/)?生成骨架/,
  /已选 N [|｜/] 生成骨架/,
  /酒店槽[^\n]*不提供[“"]留空/,
  /酒店\/早餐、换酒店行李处理、预约\/门票/,
];

for (const path of currentPlanningFiles) {
  const text = read(path);
  for (const pattern of stalePatterns) {
    assert.doesNotMatch(text, pattern, `${path} contains stale Epic 2 semantics: ${pattern}`);
  }
}

console.log('BMAD handoff check passed: Story 2.2 is the active implementation story.');
