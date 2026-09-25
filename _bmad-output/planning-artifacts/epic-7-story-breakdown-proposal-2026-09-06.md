---
project: nomad-mvp
date: 2026-09-06
updated: 2026-09-07
workflow: bmad-create-epics-and-stories-step-3
status: approved-breakdown-with-deferral
epic: 7
epicEntryAuthorized: true
storySplitApproved: true
splitApprovedDate: 2026-09-06
detailedStoryInReview: null
nextStoryToDefine: null
readyForEpicCompletionReview: false
epicCompletionConfirmed: true
completionConfirmedDate: 2026-09-07
nextEpic: 8
deferredStories:
  - '7.2'
approvedDetailedStories:
  - '7.1'
  - '7.3'
  - '7.4'
  - '7.5'
  - '7.6'
---

# Epic 7 Approved Story Breakdown

The user confirmed entry into Epic 7 after Epic 6's five stories and explicit scope deferrals.
Epic 6 planning is completion-confirmed; no implementation story or historical sprint status is
marked done by this transition. The user approved these six vertical slices on 2026-09-06.
Individual in-scope Story 7.x contracts have now completed collaborative review and GWT append;
split/story approval does not mark any story ready for development. Story 7.1 was individually approved
on 2026-09-06 and appended to epics.md with its two referenced boards. The user subsequently
excluded 7.2 from MVP; `check-in-scope-decision-2026-09-06.md` records that approved amendment.
Story 7.3's 14 GWT scenarios and Account Actions R2 are approved/appended: account and available
actions only, no visible quota/usage. See `settings-account-actions-scope-2026-09-06.md` and
`story-7-3-review-2026-09-06.md`. Story 7.4's 20 GWT, current-data JSON-in-ZIP scope and Account
Export Core/Recovery R1 are approved and appended. Story 7.5's 22 GWT and Account Delete
Core/Recovery R1 are approved/appended with irreversible acceptance and explicit retention scope.
Story 7.6's 20 GWT and Feedback Entry R1/Recovery R2 were approved/appended on 2026-09-07,
including the annotations removing extra upload-error prompts and busy bottom actions. The coverage
review found no unassigned current MVP requirement across the five approved stories/98 GWT.
The user confirmed whole-Epic planning completion and entry into Epic 8 on 2026-09-07.
Read `epic-7-coverage-review-2026-09-07.md` for coverage and
`epic-8-story-breakdown-proposal-2026-09-07.md` for the next proposed split.
This does not mark 7.2 done or approve its manual design.

## Epic Goal and Requirements

Epic 7: 持续使用行程并管理账户.

Users can reopen trips, use actual available account actions, export
or delete account data, and reliably submit feedback.

- FR12: Settings/account/data/feedback entry points.
- FR25/FR38: true available/recovery actions with internal enforcement; no user quota/usage or BYOK.
- FR40: MVP recent trips; per-slot check-in is excluded. FR40.1 photo-based marks/media are deferred.
- FR45: feedback routing, browser fallback and a first-party minimal submission path.
- NFR3/NFR7/NFR8/NFR15/NFR16/NFR18/NFR20: secret protection, data controls, accessible mobile
  states, third-party feedback privacy, real navigation behavior, no hidden location or owner leaks.
- AR1-AR6, AR11-AR15, AR17-AR20: brownfield delivery, authoritative contracts, durable jobs,
  owner/version safety, real-service verification and dependency order. AR16 is no longer a MVP gate.
- UX-DR2/3, UX-DR30-33: mobile accessibility, ongoing use, account/actions and recoverability.

## Approved Slices

| Approved story split | User-visible delivery | Main requirements | Boundary and dependency |
| --- | --- | --- | --- |
| 7.1 最近行程与继续使用 | Find own standalone/linked trips, reopen the correct current plan or recoverable draft/job, restore context | FR40 (recent), existing FR49 navigation reuse | No check-in dependency; current-revision/owner lookup rather than duplicating Trip publication |
| 7.2 行程打卡与取消打卡 (Deferred) | Excluded from MVP by user confirmation; original manual proposal retained only as history | Former FR40 check-in / AR16; future FR40.1 needs fresh design | Not an execution story or prerequisite; no renumbering of 7.3-7.6 |
| 7.3 设置页账号与可用操作 | Read-only account and deployed operation entries, safe current-session logout; remove BYOK | FR12, FR25, FR38 (internal enforcement boundary) | No usage/quota/global-job summary; no new quota engine or 7.4-7.6 workflow implementation |
| 7.4 账号数据副本导出 | Request, follow and securely download a recoverable account-data copy | FR12, NFR7, NFR20 | Separate from Epic 5 travel image export; include current owned entities without exposing shared users or secrets |
| 7.5 账号删除与清理结果 | Confirm deletion, make account/session access consistent and complete resumable owned-data/object cleanup | FR12, NFR7, NFR20 | Independent of whether 7.4 was used; requires idempotent cleanup and truthful partial/failure behavior, not just queue acceptance |
| 7.6 反馈入口与可靠提交 | Open configured feedback service; fall back to a working text/optional-image form with actual submission result | FR45, FR12, NFR15-NFR16 | Reuse Settings/sidebar/exception entries; a browser or email-client open is not successful feedback delivery |

Each story owns the minimal entities/API/migrations/worker behavior needed for its usable outcome.
Do not create a standalone prerequisite database story or combine export and deletion into one
large account story. Direct access to export/delete/feedback must work through existing entry
points as each slice ships; Settings does not claim unfinished backend capabilities are available.
The amended MVP order is 7.1 -> 7.3 -> 7.4 -> 7.5 -> 7.6, preserving deferred number 7.2.
The semantic checkpoints below are resolved by the individually approved contracts; concrete
implementation evidence and final readiness remain gates, not implied by this planning approval.

## Observed Brownfield Baseline

- `apps/mobile/src/settings/SettingsScreen.tsx` still loads user-key status and renders OpenAI Key
  input/validation/save/delete. The approved product direction removed BYOK from the MVP user flow.
  Story 7.3 must replace this surface while respecting historical Story 1.5 delivery evidence.
- `apps/server/src/routes/account.ts` accepts export/delete and returns a Date.now-derived task id
  with queued status; `apps/server/src/plugins/queues.ts` configures the two queues. These inspected
  paths alone do not demonstrate durable task queries, downloadable exports or completed cleanup.
  Stories 7.4/7.5 must verify the full repository/worker path and close the production lifecycle.
- `apps/server/src/routes/feedback.ts` generates a product URL. The mobile fallback currently opens
  a mailto to `support@nomad-mvp.local`; that is not proof of a first-party stored feedback submission.
  Story 7.6 must deliver FR45's actual fallback and truthful success state.
- The inspected Home/API/Prisma paths contain existing planning/import foundations, but no complete
  recent-trip aggregation or independent check-in contract. Do not assume mock state is persisted.
- Historical Story 1.5 explicitly limited its account scope to entry points/queues. Keep that done
  history; new stories extend it instead of describing the current gaps as migration failures.

## Required Semantic and Architecture Review

### Recent-trip status

Resolved by Story 7.1 approval: `已生成` means a readable current itinerary, not travel completion,
complete details or clean validation. Saved half-filled changes use `有未完成的修改`; only actual
current terminal tasks use failure copy. Source docs/UX/minimal resume architecture are synchronized.

Standalone Plans and linked Trips need stable identity, correct scope and current revision lookup.
Completed or failed jobs may offer different recovery paths. Duplicated same-name cities must
not produce duplicated aggregate cards. Check-in is not required to reopen a plan.

### Deferred Check-in Architecture (AR16, Not a MVP Gate)

The following points are retained from the historical manual proposal. The user deferred 7.2,
so none is a current implementation/readiness requirement. Future FR40.1 requires a fresh photo/
location/privacy/media design and does not automatically inherit these rules:

- The state is owned by the traveler and keyed to a particular visit/slot occurrence, not just a
  CanonicalPOI name/id, checklist item or transient revision-row UUID.
- Reads and writes authorize owner, stable target and host/child Plan scope. Writes explicitly set
  checked/unchecked with idempotency and expected state/context versions rather than blind toggling.
- A check-in does not publish PlanRevision/TripRevision, modify transport or act as schedule undo.
- Define inheritance separately for retime, move-day, replacement, deletion/undo and replan.
  Replacing a restaurant/place must not inherit another place's visit state; the same POI on two
  dates must not be merged. Preserve only lineage that is supported by the selected rule.
- Decide which POI/meal/hotel/transport/free-time items expose the control and how it appears on
  the compact ResultSheet or slot detail without disrupting the approved POI-only overview.
- User check-in is a user assertion, not GPS verification. It must not enable background location,
  preference learning, automatic memory or 48-hour reminders. Story 6.2 can consume valid matching
  completed-visit facts later but already works without them.

These were unapproved manual-design constraints, not an approved schema or migration. They are
now deferred exploration, not a developer prerequisite or evidence AR16 has been implemented.

### Account and feedback boundaries

- Account-data download is distinct from itinerary image download. Approved 7.4 defines current
  structured owned data in JSON-in-ZIP, consistent snapshot, protected delivery and actual expiry.
  History/raw media/internal secrets are excluded; image export remains no-ZIP.
- Approved 7.5 distinguishes accepted/access-stopped, cleaning, online-cleanup-complete, known
  incomplete and read-unknown. No cancellation after acceptance; shared refs stay protected and
  isolated backups/minimal retained records are disclosed under verified actual policies.
- First-use quota protections remain in earlier stories and are internal only. Epic 7 exposes
  account and available operations, not account-wide usage/status; Telegram remains Epic 8.
- Feedback must use the real Web/PWA/container capabilities. Verify the configured third-party
  product link, current official integration details and actual submission result at story time;
  no email-client launch can be counted as a stored or delivered report.

## Visual Checkpoints

The registry now contains nine approved boards for all five in-scope stories. Old usage, manual
check-in and feedback Recovery R1 boards are superseded/deferred, not current authority. Remaining
edge variants below require implementation screenshots/tests rather than being silently omitted:

| Story | Needed visual states |
| --- | --- |
| 7.1 | recent list, standalone/linked identity, available/in-progress/failed recovery, empty/error |
| 7.2 (Deferred) | Existing manual check-in boards retained as history; no current-MVP visual gap or implementation gate |
| 7.3 | Approved Account/actions R2 and logout; R1 usage display superseded, no user-visible quota |
| 7.4 | Approved Account Export Core/Recovery R1: request/running/ready, actual generation failure, expired artifact and download retry; queued/auth/read-error variants remain text-defined |
| 7.5 | Approved Account Delete Core/Recovery R1: scope/final confirmation, accepted/cleaning, online cleanup plus retention disclosure, known incomplete cleanup and read failure |
| 7.6 | Approved Entry R1/Recovery R2: external routes/form/receipt; disabled upload without extra failure prompt and busy state without bottom actions; actual timeout recovery remains text-defined |

Story-specific visuals accompany each detailed collaborative review, as the user requested.
Story 7.3 `story-7-3-account-actions-r2.png` and its full corrected contract are approved;
R1 usage and its old draft are superseded. Story 7.4's `story-7-4-account-export-core-r1.png`
and `story-7-4-account-export-recovery-r1.png` are approved subject to text boundaries.
Story 7.5's `story-7-5-account-delete-core-r1.png` and `story-7-5-account-delete-recovery-r1.png`
are approved; their backup example does not approve any retention duration. Story 7.6's
`story-7-6-feedback-entry-submit-r1.png` and `story-7-6-feedback-recovery-r2.png` are approved.
The former Recovery R1 is superseded; full approval followed the corrections on 2026-09-07.
Story 7.1 uses approved references `story-7-1-recent-trips-resume-r1.png` and
`story-7-1-recent-trips-recovery-r1.png`, subject to its confirmed annotation. Story 7.2's
`story-7-2-check-in-core-r1.png` and `story-7-2-check-in-recovery-identity-r1.png` are deferred
historical exploration and do not authorize MVP UI or schema changes. Final in-scope approved stories
are appended in GWT format with Requirements visible in
conversation. This approved decomposition does not replace the later Sprint Planning queue.
