# Story 8.2: Evaluation Alternatives

Evidence checked: 2026-09-07. Bounded supporting research for BMAD CE Step 3, not implementation approval. Promptfoo selection belongs to the other research lane.

## Boundary and Baseline

The user's latest instruction establishes approved Story 8.1: Sentry plus explicitly isolated Langfuse tracing, safe metadata only. Local recovery documents still describe an earlier approval snapshot; they do not override that instruction.

Limited reads confirm TypeScript ESM, package engines `>=20`, server dependency `langfuse ^3.21.0`, and an existing `packages/prompts/registry.json` plus output schema. Neither dependency presence nor this historical registry proves working experiments. Target Node 22 compatibility, installed/deployed versions and cloud entitlements remain **unverified**. No installs, credentials, provider calls, accounts or business changes were performed.

## Comparison

### Langfuse: Optional Complement

Langfuse already offers datasets, prompt management, experiments, custom evaluation pipelines, human annotations and model judges. Reusing that product avoids another experiment platform. Its platform repository is MIT except `ee` directories; enterprise code is not covered by that blanket permission. [Langfuse GitHub](https://github.com/langfuse/langfuse)

The current JS/TS experiment runner supports application callbacks, item/run evaluators, concurrency and isolated item failures. Hosted datasets produce comparable dataset runs; local datasets produce traces/scores, **not dataset runs**. Custom evaluator functions execute in the calling process. Consequently, "offline evaluation" means evaluation outside production, not necessarily disconnected operation: automatic tracing still exports. An experiment returning successfully does not establish complete coverage or a passing CI threshold. Current examples use scoped `@langfuse/*` packages, not the repository's declared unscoped package; do not copy their global OTel bootstrap into Story 8.1's isolated setup. [SDK experiments](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)

Dataset item additions, updates, deletion and archiving create timestamp versions; fetching defaults to latest. **Schemas are not versioned with items.** The dataset guide demonstrates timestamp-pinned JS experiments, but the SDK page above still says experiments use latest and pinning is forthcoming. Treat exact selected-release behavior as **unverified**, requiring a historical-version smoke test. Freeze local dataset/schema hashes regardless; a dataset/run name is not an immutable replay identity. [Dataset versioning](https://langfuse.com/docs/evaluation/experiments/datasets)

Observed Cloud limits: Hobby has 50k units/month, two users and 30-day access; Core has 90-day access; Pro/Enterprise have three-year access. Retention management starts at Pro; fine-grained RBAC/enterprise SSO require Pro's Teams add-on or Enterprise, and audit logs are Enterprise. These are service entitlements, not free SDK guarantees or judge-token allowances. Actual project tier is **unverified**. [Pricing](https://langfuse.com/pricing)

Access windows are **not deletion guarantees**. Without retention configuration, event data is not automatically deleted; self-hosting defaults to indefinite storage. Built-in self-hosted retention requires Enterprise Edition. Retention can delete traces referenced by dataset runs, leaving broken evidence links; versioned object storage also needs non-current-version cleanup. Dataset/version and backup erasure behavior remains **unverified**, not established by trace retention. [Retention](https://langfuse.com/docs/administration/data-retention)

### DeepEval: Defer

Apache-2.0, pytest-style assertions, custom metrics and extensive RAG/agent/model-judge metrics are attractive for later semantic evaluation. The documented Python path adds a runtime and TS-output bridge. Current GitHub also contains TypeScript AI SDK/Mastra examples: **not Python-only**, but Node 22 offline feature parity is **unverified**. Import-time dotenv loading can be disabled with `DEEPEVAL_DISABLE_DOTENV=1`; login enables automatic result syncing. [DeepEval GitHub](https://github.com/confident-ai/deepeval)

Local JSON run persistence is configurable, not enabled by default. Missing-parameter skips and ignored metric exceptions can leave missing results; both options default false. Cache writes default on, reuse off. Pin evaluator/configuration versions and distinguish cache replay from fresh inference. [Run configuration](https://deepeval.com/docs/evaluation-flags-and-configs)

Default PostHog telemetry has an explicit `DEEPEVAL_TELEMETRY_OPT_OUT=1` switch; Sentry error reporting is opt-in. Confident AI is a separate hosted data destination with enhanced paid governance; exact retention/RBAC/deletion entitlements are **unverified**. Reject adopting that additional platform for 8.2. [Privacy](https://deepeval.com/docs/data-privacy)

### Inspect AI: Defer

The UK AI Security Institute's MIT framework offers composable Python evaluation and scoring, including multi-turn/tool tasks. Strong candidate for later agent research, but its evaluation runtime adds Python; a TypeScript viewer is not a native TS evaluator. [Inspect GitHub](https://github.com/UKGovernmentBEIS/inspect_ai)

Local `.eval`/JSON logs preserve sample inputs/outputs/targets/scores, configuration and usage. Retry creates a new log and can reuse completed samples. Status must be checked before aggregation; a completed run is not proof of acceptable quality. Logs are editable, so they are not intrinsically immutable audit records. Raw API logging includes initial calls and errors; disabling ordinary API logging still leaves errors. Keep synthetic inputs and restricted artifacts, not production transcripts. [Inspect logs](https://inspect.aisi.org.uk/eval-logs.html)

## Minimal Decision

**Adopt the boundary, not another runner:** local versioned fixtures, deterministic checks and CI artifacts remain authoritative. Optionally publish safe result metadata/scores to existing Langfuse from a trusted post-run step, without rerunning inference. Defer hosted dataset/experiment mirroring until a concrete review need and privacy/version tests justify it. Reject new public UI, hosted-platform duplication and automatic production-trace-to-dataset capture.

Custom rule evaluation over fixed outputs can avoid model calls; a local judge still costs compute. Remote candidates and judges cost separately and remain nondeterministic. No framework makes live model reruns byte-reproducible.

## Acceptance Implications

1. **Independent gate:** without Langfuse, 8.3 routing, 8.4 budgets or 8.6 dashboards, WSL Node 22 runs deterministic checks and emits JSON plus readable A/B evidence. Untrusted PRs receive no secrets and cannot make outbound evaluation/telemetry calls. Frozen-output replay must not claim a changed model was tested.
2. **Frozen comparison:** record run/attempt and baseline IDs, ordered case IDs, dataset/schema/prompt/code/lockfile/evaluator hashes, model identity/parameters, fixture provenance, and live/replay/cache mode. Compare matched cases; reject mismatched baselines. Preserve prior attempts.
3. **Truthful results:** distinguish hard failure, quality regression, execution error, incomplete, invalid and not-run. Show planned/completed/scored counts and branch coverage; missing/non-finite scores, evaluator errors, duplicate cases or interruption cannot pass. A skipped optional live lane does not fail deterministic CI, but never satisfies a required live gate.
4. **Domain authority:** deterministic checks cover import/geography, required/along-route intent, stays/transport/day excursions, schedule immutability during fill and protected wording. Report branch deltas; judge averages cannot override hard failures. Unknown usage/cost stays unknown.
5. **Authorized live lane:** require trusted explicit authorization, bounded cases/concurrency/retries/time/tokens/spend and cancellation before future centralized budgets exist. Record candidate and judge usage separately, judge rubric/version and repeated-run variation; never silently substitute models.
6. **Privacy and retention:** test sentinel private values against every sink, including score comments/errors. Export only allowlisted metadata, using isolated tracing. Keep replay bundles restricted, checksummed and outside git except approved synthetic fixtures; configure owner/expiry/deletion and test replay without vendor access. Expired evidence is unavailable, not a passing audit. Langfuse upload failure changes publication status, not the local quality verdict.
