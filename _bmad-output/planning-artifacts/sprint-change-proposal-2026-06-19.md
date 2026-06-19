# Sprint Change Proposal: BYOK Deferral and Xiamen Validation Learnings

Date: 2026-06-19
Project: nomad-mvp
BMAD workflow: bmad-correct-course
Mode: Batch
Status: Approved for documentation update

## 1. Issue Summary

The MVP scope changed after two concrete signals:

1. Token costs dropped enough that BYOK is no longer required as an MVP delivery path.
2. The Xiamen travel-planning validation project at `/home/tong123/work/厦门旅游规划` completed a real end-to-end run from Xiaohongshu collection through multimodal extraction, POI verification, itinerary skeleton, AI fill, and final itinerary export.

This makes the current planning artifacts inconsistent. PRD, Epics, UX, Tech Spec, and Architecture still describe BYOK as a required MVP user path, while the product direction is now platform-managed AI usage with quotas, rate limits, cost monitoring, and graceful degradation. The Xiamen run also revealed missing MVP requirements around speech detection before ASR, short-video frame extraction, AMap-verified POIs, source attribution, hotel-aware planning, hard time-bound slots, confirm-step questions, fuzzy slot completion, and export fixtures.

Evidence inputs:

- `/home/tong123/work/厦门旅游规划/方法论总结.md`
- `/home/tong123/work/厦门旅游规划/任务规划.md`
- `/home/tong123/work/厦门旅游规划/output/行程单_final.md`
- `/home/tong123/work/厦门旅游规划/config.json`
- `/home/tong123/work/厦门旅游规划/plan/skeleton_final.json`

## 2. Impact Analysis

### Epic Impact

- Epic 1 is already complete. Story 1.5 implemented Settings, account, feedback, and BYOK entry points. That work should not be rolled back now. Any existing BYOK entry point is treated as internal/post-MVP compatibility and should be hidden or de-emphasized in the MVP user path.
- Epic 2 is affected by the Xiamen validation learnings. Story 2.0 needs richer Confirm fields, and Story 2.1 needs hotel-aware, hard-time-slot-aware, and fuzzy-slot completion constraints.
- Epic 3 is affected by BYOK deferral and by the real validation chain. Story 3.2 should keep provider routing but remove user-key override from MVP. Story 3.3 should become account privacy, quota, and compliance controls.

### Artifact Conflicts

- PRD conflicts: FR12, FR25, FR38, NFR3, technical assumptions, Settings screen, Story 3.3, and MVP pitfalls still describe BYOK as MVP.
- Epics conflicts: Story 3.3 title and Story 3.2 provider acceptance criteria include BYOK; Story 1.5 acceptance criteria still frame BYOK as an expected user path.
- UX conflicts: Settings, BYOKForm, ResultSheet BYOK education, and `byok_*` events are still MVP.
- Tech Spec conflicts: Epic 3 provider abstraction, security/privacy, acceptance criteria, tests, and assumptions still require BYOK/KMS.
- Architecture conflicts: provider abstraction, frontend networking, settings components, backend security, observability, and rate-limit docs still frame BYOK as MVP.

### Technical Impact

- No immediate business-code change is required by this correct-course pass.
- Existing BYOK API/routes can remain as compatibility or post-MVP/internal capability until a follow-up story hides or gates the UI.
- Future implementation stories should build platform quota/cost controls before exposing heavy AI usage.

## 3. Recommended Approach

Recommended path: Hybrid of Direct Adjustment and PRD MVP Review.

Actions:

1. Move BYOK out of MVP and label it post-MVP optional.
2. Replace MVP BYOK user flow with platform-managed AI usage: quotas, rate limits, cost caps, monitoring, provider fallback, and user-friendly degradation.
3. Add the Xiamen validation learnings to PRD, Epics, Epic 2/3 Tech Spec, UX, Architecture, and Ops docs.
4. Update sprint status so Epic 3 Story 3.3 is tracked as account privacy, quota, and compliance controls.
5. Continue BMAD flow by regenerating or validating the next Epic 2 story after the planning artifacts are updated.

Scope classification: Moderate. Backlog and planning artifacts need reorganization, but no fundamental replan or rollback is required.

Risk:

- Low technical risk for documentation updates.
- Medium product risk if existing BYOK UI remains visible in MVP; mitigate with a follow-up story to hide or gate it.
- Medium planning risk if Story 2.0 starts before Confirm and hotel constraints are updated; mitigate by updating story inputs first.

## 4. Detailed Change Proposals

### PRD

- Rewrite FR12 from BYOK settings to account, AI usage/quota status, privacy export/delete, and feedback.
- Rewrite FR25 from BYOK guide to platform AI usage, quota, and degradation education.
- Rewrite FR38 from BYOK cold start to platform quota and cost-control policy.
- Rewrite NFR3 from BYOK KMS to platform-managed provider secrets, log redaction, signed object URLs, rate limits, and cost caps.
- Expand FR4, FR27.1, FR32, FR36/36.1, FR37, and FR39 with Xiamen validation learnings.

### Epics and Stories

- Keep Epic 1 done; annotate Story 1.5 BYOK as post-MVP/internal compatibility if referenced.
- Update Story 2.0 Confirm fields: wake preference, arrival/departure time, hotels, hotel breakfast, luggage handling, reservations/tickets.
- Update Story 2.1 generation constraints: dawn/sunset/night/night-market slots, hotel-aware clustering and buffers, AMap-verified POIs, fuzzy slot completion path.
- Update Story 3.2 provider routing: no BYOK override in MVP.
- Rename Story 3.3 to `Account Privacy, Quota, and Compliance Controls`.

### UX

- Replace BYOKForm with AIQuotaPanel.
- Replace Settings BYOK flow with AI Usage & Quota status.
- Replace ResultSheet BYOK education with quota/cost-friendly reminders and graceful degradation.
- Replace `byok_*` analytics with `ai_quota_*` or `quota_*` events.

### Architecture and Ops

- Remove MVP UserKeys/KMS/BYOK assumptions from authoritative architecture shards.
- Use server-managed provider secrets, provider routing, cost budgets, rate limits, signed URLs, and log redaction.
- Update rate-limit policy from "free quota + BYOK cold start" to platform quota/cost budgets.

## 5. Implementation Handoff

Handoff recipients:

- Product Owner / Developer: update PRD, Epics, sprint status, and next story queue.
- Architect / Developer: update architecture, ops, and tech specs.
- UX Designer / Developer: update UI/UX specs and ensure next stories do not expose BYOK as MVP.

Success criteria:

- BYOK remains only as post-MVP/internal compatibility in planning docs.
- Platform-managed AI usage is the MVP path.
- Xiamen validation learnings are present in Epic 2/3 planning context.
- `sprint-status.yaml` tracks Story 3.3 under the new name.
- The next BMAD story can be created from updated artifacts without reintroducing BYOK as an MVP deliverable.

## 6. Checklist Completion

- [x] 1.1 Triggering story identified: post-Epic 1 and before Story 2.0, informed by Xiamen validation and BYOK scope change.
- [x] 1.2 Core problem defined: MVP scope change and real-validation requirement additions.
- [x] 1.3 Evidence gathered from Xiamen artifacts.
- [x] 2.1 Current epic impact assessed.
- [x] 2.2 Epic-level changes defined.
- [x] 2.3 Future epics reviewed.
- [x] 2.4 No new epic required.
- [x] 2.5 Epic order unchanged; continue into Epic 2 after artifact updates.
- [x] 3.1 PRD conflicts identified.
- [x] 3.2 Architecture conflicts identified.
- [x] 3.3 UX conflicts identified.
- [x] 3.4 Secondary docs identified.
- [x] 4.1 Direct adjustment viable.
- [x] 4.2 Rollback not recommended.
- [x] 4.3 MVP review viable and required.
- [x] 4.4 Recommended path selected.
- [x] 5.1 Issue summary created.
- [x] 5.2 Impact and artifact adjustments documented.
- [x] 5.3 Path forward documented.
- [x] 5.4 MVP impact and action plan documented.
- [x] 5.5 Agent handoff plan documented.
