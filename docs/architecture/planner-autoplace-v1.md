Planner Autoplace v1

Terms & Inputs
- D: number of days
- T_commute_max = D × 24 × 60 × 0.01 (min)
- cluster: geo cluster (city 1.5–2km; suburb 3–4km)
- slot: 2h block (activity timeline)
- time_hint: frozen slot
- must_go: user/system designated must-visit
- others: user-selected but not placed
- anchors: offline city×season×tod×category Top-K

Offline Anchor Pool (72h refresh)
- Data: AMap/OSM/events, open hours, coords, closures; UGC signals
- AI: offline cleaning only; classify, short reason why_short
- Score example: 0.35 trend_90d + 0.25 rating_adj + 0.15 ugc + 0.15 accessibility + 0.10 recency − 0.10 closure
- Store: AnchorPool(topk_json[{poi_id, score, tags[], why_short}])

Online Daily Flow (per day; MVP single-city)
SSE: started → freeze → must_go → quota → candidates → place → validate → persist → done

1) freeze: place time_hint (immutable)
2) must_go (not counted in quota): filter feasibility; sort tight_window/booking > sunset/weather > popularity > proximity; conflict with frozen → skip
3) quota: S_left = S_total − S_hint − S_must; quota = ceil(α × S_left), α default 0.6; cold-start: if none placed and S_left ≥ 1, quota = max(quota, 1). (Post‑MVP 预留：多城市按 `transport_slot` 分段单独计算配额)
4) candidates: others → near-similar (opt) → anchors; dedupe; K(d) = clamp(K_min, 3×quota+spare, K_max)
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

Priority & Ties
- Placement priority: time_hint > must_go > others
- First must_go without time_hint: category heuristics (sightseeing 10–12, F&B 12–14/18–20, nightlife 20–22) → earliest feasible; shift to D2 if needed
 - Category slots externalized: see `docs/architecture/planner-category-slots.json`（hotel is display-only and not auto-placed; dining windows remain hints only）

Security & Cost Notes
- BYOK uses local CMK env (LOCAL_KMS_CMK_B64), no cloud KMS

