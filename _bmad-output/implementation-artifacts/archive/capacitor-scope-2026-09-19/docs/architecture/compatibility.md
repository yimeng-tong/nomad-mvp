# Compatibility (v0.4 to v0.6)

| Concern | v0.4 baseline | v0.6 target | Migration owner |
| --- | --- | --- | --- |
| Production auth | dev identity/OTP and in-memory session baseline | verified identity, stable owner migration, durable multi-device sessions and scoped operator grants | New 1.0 before real-user/first-operator use; historical 1.1–1.5 unchanged |
| User planning flow | Confirm -> Picker -> partial Skeleton -> AI Fill | S2/S3/S4/S5 -> one full PlanningJob -> editable timeline -> detail enrichment | Epic 2, Epic 3, Epic 5 |
| Planner versions | Quick first, HQ switch/adopt | One current PlanningJob; internal attempts fenced and never silently overwrite edits | Story 2.9 |
| Time | fixed 2h/4h visible slots | AI may align 15m; user edits any valid minute | Story 2.3 and Epic 3 editing |
| Picker intent | `selected_required` only | `required / along_route / unselected`, overview mapping | Story 2.7 |
| Validation | permanent pre-Fill gate | initial validation plus mutation-triggered incremental validation | Story 2.11 and Epic 3 repair |
| Filler | arranges remaining blocks and enriches | enriches only; cannot change date/time/order | Epic 5 detail story |
| Import UI | one foreground link | multiple single-link jobs + independent FIFO presentation queue | Story 1.6 |
| Import ownership | job/inspiration foundation | owner import records and protected original URL | Story 1.8 |
| Import processing | stub multimodal seam and text/ocr/vision diagnostics | real media sampling, VAD/ASR, evidence signals, complete nullable AMap facts | Stories 1.9-1.11 |
| Import resume | in-memory event stream plus job final state | persisted monotonic event cursor across process restart | Story 1.7 |
| Geography | L1/L2/L3 and scalar `business_area` hint | provider POI facts and versioned manual corrections; BusinessArea membership separately normalized | 1.11 POI/correction; 6.3 BusinessArea |
| Multi-city | post-MVP or mixed Plan assumptions | Trip aggregate links single-city Plans with atomic TransferLeg handoff | Epic 4 |
| Accommodation | plan-global luggage / display hotel | per-night Stay, breakfast tri-state and LuggageTransition | Story 2.5, Epic 3 and Epic 4 |
| Preferences/load | wake/start fields and coarse pace | optional constraints, evidence-derived interests, pace soft constraints and DayLoadEstimate | Stories 1.9-1.10, 2.6 and 2.14 |
| Meals | ordinary candidate or fixed block | MealSlot fixed/choice/undecided + owner area recall | Epic 6 |
| Shopping | POI or notes | revisioned checklist text with optional label shortcuts; structured attributes/stores and checklist-to-schedule conversion deferred | Stories 6.4-6.5; existing travel buffers remain in Epics 2-4 |
| Location | generic map usage | foreground permission, freshness, fallback and no tracking | Epic 6 |
| Weather | no current contract | reliable forecast/seasonal context, typed validation and preview-only adjustment | Epic 3 |
| Export | `/export/png` and Plan-oriented rendering | current-revision image export, WebP/JPEG output policy, durable job and hard-conflict gate | Story 5.4 |

Compatibility inputs may be accepted temporarily at API boundaries, but the mobile client must
not expose deprecated Quick/HQ adoption, smart-planning toggle, fixed 2h/4h user edits or BYOK.
Removal requires telemetry and a separately reviewed migration; deprecated input must not select
a different user-visible workflow.
