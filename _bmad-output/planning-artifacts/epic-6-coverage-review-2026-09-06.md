---
project: nomad-mvp
date: 2026-09-06
workflow: bmad-create-epics-and-stories-step-3
status: planning-completion-confirmed
approvedStories: ["6.1", "6.2", "6.3", "6.4", "6.5"]
scopeDispositionConfirmed: true
readyForEpicCompletionReview: false
epicCompletionConfirmed: true
completionConfirmedDate: 2026-09-06
nextEpic: 7
---

# Epic 6 Planning Coverage

Five stories are approved as planning contracts, not implemented deliveries. The user's narrowed
Story 6.5 is lightweight shopping text plus optional label insertion. Advanced shopping search,
store relations, L2-aware arrangement and contextual buying hints are explicitly deferred, along
with sales/stock evidence, actual-arrival triggers and automatic-application authorization/undo.
The user also confirmed deferral of checklist return-task-to-schedule conversion. Ordinary return
records stay in 6.4 and earlier travel/stay/luggage buffers remain required. No Story 6.6 is added.

| Requirement slice | Coverage | State |
| --- | --- | --- |
| FR36 meal presentation; FR36.2 fixed/choice/undecided | 6.1 MealSlots and one-primary/two-backup pools | Story approved |
| FR36.2 location recall; FR48 fallback | 6.2 single foreground fix and honest plan context | Story approved; no Epic 7 check-in dependency |
| FR36.2 area food; FR47 membership/owner sources | 6.3 BusinessArea and POI-attached hints | Story approved |
| FR14 food geography integration | Existing POI/RouteFact capabilities plus 6.1-6.3 | Story-scoped staging required at implementation |
| FR46 records, general notes, CRUD and direct/AI entry | 6.4 independent checklist versions | Story approved |
| FR46 shopping text capture | 6.5 one text input and label shortcuts | Story approved |
| Structured attributes, multiple stores, search, automatic shopping and opportunistic hints | Deferred Work and shopping scope decision | User-directed later iteration; not MVP delivery |
| FR46 return-task records | 6.4 explicit record-only GWT; no reserve-time action | Current MVP covered |
| Checklist return-task-to-time-buffer conversion | Deferred Work; old preview retained as later exploration | User-confirmed deferral; not a missing MVP story |
| Existing hotel/luggage/transport buffers | Earlier approved Epic 2-4 contracts | Retained; not duplicated or withdrawn |
| UX-DR26-UX-DR28 | 6.1-6.5 and their registered visual/text contracts | Covered for the narrowed approved surfaces |

## Confirmed Scope Disposition

The old 6.5 combined shopping attributes/stores with converting a checklist return task into an
explicit time buffer, such as pickup or tax-refund preparation. The user first approved lightweight
shopping input and deferred advanced shopping, then explicitly agreed to defer the separate
checklist-to-schedule feature while preserving necessary travel/stay/luggage buffers.

FR46 now distinguishes ordinary return records (6.4), lightweight shopping text (6.5), and the
explicitly deferred scheduling extension. No current Epic 6 requirement slice remains without an
approved story or an explicit scope disposition. This is planning coverage, not implementation
completion. The old return-time preview is not an MVP visual authority and the queue is not
expanded or renumbered. Existing edit controls are not presented as delivery of the deferred feature.

## Workflow Position

The user explicitly confirmed entry into Epic 7 on 2026-09-06, completing the Epic 6 planning
transition. The five individual stories and both deferrals are approved; do not ask for the same
scope or completion approval again. The next checkpoint is the proposed Epic 7 story split. Final
Implementation Readiness and Sprint Planning still follow all epics. The historical sprint YAML
and paused legacy Story 2.2 implementation remain unchanged.
