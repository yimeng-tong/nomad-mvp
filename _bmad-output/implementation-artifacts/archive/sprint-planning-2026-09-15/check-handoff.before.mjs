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

assert.match(current, /^current_epic: [3-8]$/m);
assert.match(current, /^last_completed_story: 2-1-generate-day-skeleton-with-quick-and-hq-planning$/m);
assert.match(current, /^current_story: 2-2-timeline-editing-undo-and-history$/m);
const planningPaused = /^current_story_status: implementation-paused-for-replanning$/m.test(current);
const readinessDiscovery = /^planning_status: bmad-implementation-readiness-step-1-awaiting-file-confirmation$/m.test(current);
const readinessInProgress = /^planning_status: bmad-implementation-readiness-in-progress$/m.test(current);
const readinessNeedsWork = /^planning_status: bmad-implementation-readiness-complete-needs-work$/m.test(current);
const readinessReady = /^planning_status: bmad-implementation-readiness-ready-for-sprint-planning$/m.test(current);

if (planningPaused && (readinessDiscovery || readinessInProgress || readinessNeedsWork || readinessReady)) {
  const epics = read('_bmad-output/planning-artifacts/epics.md');
  assert.match(epics, /^  - step-04-final-validation$/m);
  assert.match(epics, /^finalValidationStatus: passed$/m);
  assert.match(epics, /^workflowStatus: completed$/m);
  assert.match(epics, /^workflowCompletionConfirmed: true$/m);
  assert.match(current, readinessReady
    ? /^next_bmad_action: bmad-sprint-planning$/m
    : readinessNeedsWork ? /^next_bmad_action: bmad-prd$/m
      : /^next_bmad_action: bmad-check-implementation-readiness$/m);
  const reportPath = current.match(/^readiness_report: (.+)$/m)?.[1];
  assert.ok(reportPath, 'Active IR must point to its current report');
  const report = read(reportPath);
  if (readinessReady) {
    assert.match(current, /^next_bmad_checkpoint: start-sprint-planning$/m);
    assert.match(report, /^status: passed-targeted-revalidation$/m);
    assert.match(report, /^readinessVerdict: READY$/m);
    assert.match(report, /^readinessScope: sprint-planning$/m);
    assert.match(report, /^openFindings: \[\]$/m);
    assert.match(report, /^productionReady: false$/m);
    assert.match(report, /^sprintPlanningStarted: false$/m);
    assert.match(report, /^implementationAuthorized: false$/m);
    assert.match(epics, /^### Story 1\.0: /m);
    assert.match(epics, /^- FR4\.2: /m);
    const storyCount = [...epics.matchAll(/^### Story \d+\.\d+:/gm)].length;
    const gwtCount = [...epics.matchAll(/^\*\*Given\*\*/gm)].length;
    assert.match(report, new RegExp(`^storyCount: ${storyCount}$`, 'm'));
    assert.match(report, new RegExp(`^gwtScenarioCount: ${gwtCount}$`, 'm'));
    assert.ok(read('_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md')
      .includes('OPS-01'), 'SP needs the approved operational prerequisite record');
  } else if (readinessDiscovery) {
    assert.match(current, /^next_bmad_checkpoint: confirm-ir-document-selection$/m);
    assert.match(report, /^status: document-discovery-awaiting-confirmation$/m);
    assert.match(report, /^fileSelectionConfirmed: false$/m);
    assert.match(report, /^stepsCompleted: \[\]$/m);
  } else if (readinessInProgress) {
    assert.match(current, /^next_bmad_checkpoint: complete-ir-assessment$/m);
    assert.match(report, /^status: in-progress$/m);
    assert.match(report, /^fileSelectionConfirmed: true$/m);
    assert.match(report, /^  - step-01-document-discovery$/m);
  } else {
    assert.match(current, /^next_bmad_checkpoint: resolve-ir-findings$/m);
    assert.match(report, /^status: complete-needs-work$/m);
    assert.match(report, /^readinessVerdict: NEEDS_WORK$/m);
    assert.match(report, /^fileSelectionConfirmed: true$/m);
    for (const step of [
      'step-01-document-discovery', 'step-02-prd-analysis',
      'step-03-epic-coverage-validation', 'step-04-ux-alignment',
      'step-05-epic-quality-review', 'step-06-final-assessment',
    ]) {
      assert.ok(report.includes(`  - ${step}\n`), `Completed IR is missing ${step}`);
    }
    assert.match(report, /^sprintPlanningStarted: false$/m);
    assert.match(report, /^implementationAuthorized: false$/m);
  }
} else if (planningPaused) {
  assert.match(
    current,
    /^planning_status: bmad-create-epics-(?:step-3-in-progress|step-4-in-progress|step-4-needs-correction|step-4-validated-awaiting-completion)$/m,
  );
  if (/^planning_status: bmad-create-epics-step-4-/m.test(current)) {
    assert.match(read('_bmad-output/planning-artifacts/epics.md'), /^  - step-03-create-stories$/m);
  }
  assert.match(
    current,
    /^next_bmad_action: (continue-bmad-create-epics-and-stories|review-and-approve-epic-[3-8]-story-[0-9]+-[0-9]+)$/m,
  );
} else {
  assert.match(current, /^current_story_status: (in-progress|review)$/m);
  assert.match(current, /^planning_status: approved-correct-course-audit-corrected$/m);
  assert.match(
    current,
    /^next_bmad_action: (bmad-check-implementation-readiness|bmad-sprint-planning|bmad-dev-story|bmad-code-review)$/m,
  );
}

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

console.log('BMAD handoff check passed: active planning workflow and legacy Story 2.2 are recoverable.');
