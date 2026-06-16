# REST API Spec (High-level)

> SSOT：以 `docs/api/openapi.yaml` 为准。本文为概要清单，落地时须回填 OpenAPI。

## Ingest / XHS
- POST /ingest/xhs {url}
- SSE /ingest/{job_id}/events — stages: created|fetching|parsing|geo|storing|done

## Planner / Skeleton
- POST /plan/generate {city,start,days,pace,selected_items[]}
- GET  /plan/{plan_id}
- POST /plan/validate {plan_id} → {hard_cnt,soft_cnt,suggestions[]}
- POST /plan/fix {plan_id, action}

## Planner / HQ
- POST /plan/hq/start {plan_id} → {hq_job_id}
- GET  /plan/hq/status?hq_job_id → {state:'running|done|failed'}
- POST /plan/hq/adopt {plan_id,hq_job_id} → merge & version

## Filler / AI Fill
- POST /fill/apply {plan_id, scope:'all|slot', slot_id?}

## Export
- POST /export/png {plan_id, width_px, slice_by_day}

## Settings / BYOK
- POST /byok/validate {key}
- POST /byok/save {key}

## Observability hooks
- POST /events (optional relay)

