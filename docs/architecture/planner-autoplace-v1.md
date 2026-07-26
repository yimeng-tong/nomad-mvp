Planner Autoplace v1

Terms & Inputs
- D: number of days
- T_commute_max = D × 24 × 60 × 0.01 (min)
- cluster: geo cluster (city 1.5–2km; suburb 3–4km)
- slot: 2h block (activity timeline)
- time_hint: frozen slot
- selected_required: a user-selected L3 POI; selection itself is the required intent and no separate user-facing must-go toggle exists
- others: user-selected but not placed
- anchors: offline city×season×tod×category Top-K

Offline Anchor Pool (72h refresh)
- Data: AMap/OSM/events, open hours, coords, closures; UGC signals
- AI: offline cleaning only; classify, short reason why_short
- Score example: 0.35 trend_90d + 0.25 rating_adj + 0.15 ugc + 0.15 accessibility + 0.10 recency − 0.10 closure
- Store: AnchorPool(topk_json[{poi_id, score, tags[], why_short}])

Online Daily Flow (per day; MVP single-city)
SSE: started → freeze → selected_anchor → quota → candidates → place → validate → persist → done

1) freeze: place time_hint (immutable)
2) selected_anchor (not counted in quota): place selected_required L3 anchors by hard-time evidence and feasibility; if a hard conflict prevents placement, preserve it as unresolved_required with an explanation rather than silently dropping it
3) quota: S_left = S_total − S_hint − S_must; quota = ceil(α × S_left), α default 0.6; cold-start: if none placed and S_left ≥ 1, quota = max(quota, 1). (Post‑MVP 预留：多城市按 `transport_slot` 分段单独计算配额)
4) candidates: others → near-similar (opt) → anchors; only AMap-verified POIs can be auto-placed; unresolved slots follow existing notes → Xiaohongshu search → AMap nearby search → ask user; dedupe; K(d) = clamp(K_min, 3×quota+spare, K_max)
5) place: greedy + 1 swap; enforce T_commute_max; skip closed/overtime/too_short; stop at quota. Apply near_hotel soft boost（需已选酒店）:
   score += w_hotel · (1 - normalized_distance_to(hotel_of_day or prev_night)) for late/early periods; never override hard constraints or segment boundaries.
6) validate: conflicts ∈ {closed, overtime, too_far, open_gap_short(<45m)}; too_far skip has no replacement
7) persist: origin=ai_seed; allow 5–8s undo
8) done

Sorting & Filters (example)
- Filter: open coverage, commute reachable, min stay ≥ 45m
- Score: 0.35 near_cluster + 0.25 popularity + 0.2 time_fit + 0.15 diversity − 0.05 walk_penalty; others +0.2 bias

Feature Flags (Unleash)
- planner_autoplace_v1, alpha_autoplace(0.6), K_min/K_max, cluster radii, commute_factor_pct(0.01), arrival_day_factor(0.7)

Boundaries & Fallbacks
- open_gap_short < 45m: no auto placement
- AnchorPool unavailable: fallback to static Top-50 and log
- Dawn/sunset/night/night-market slots are hard time windows and outrank ordinary candidate placement.
- Hotel changes require luggage/check-in buffers before late-day placement.

Priority & Ties
- Placement priority: hard time_hint > selected_required > candidate_items
- First selected_required without time_hint: category heuristics (sightseeing 10–12, F&B 12–14/18–20, nightlife 20–22) → earliest feasible; shift to D2 if needed
 - Category slots externalized: see `docs/architecture/planner-category-slots.json`（hotel is display-only and not auto-placed; dining windows remain hints only）

Security & Cost Notes
- Provider secrets are managed server-side; planner calls obey platform quotas, concurrency limits, cost budgets, and fallback/degrade switches.
