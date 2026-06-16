# PromptOps Baseline (v1.0)

## Registry
- Location: `packages/prompts/registry.json`
- Fields: id, model, sampling params (temperature/top_p/max_tokens), prompt_ver, output_schema_ref

## Versioning & A/B
- Each prompt has `prompt_ver`; create new id or bump version when changing semantics.
- A/B via feature flags or traffic split; record assignment per trace.

## Rollback
- Keep previous prompt_ver; toggle routing to prior version via flag.

## Evaluation
- promptfoo baselines with thresholds per prompt id.
- Gate failures block rollout; record run history.

## Telemetry (Langfuse)
- Track: prompt_ver, model_ver, seed, cost, latency, trace_id
- Persist per run for analysis and regression tracking.

## Output Validation
- Validate against JSON Schema before applying (see `packages/prompts/schemas/fill-output.schema.json`).
- On validation fail: return user-facing error and keep plan intact; log for follow-up.
