# Story 8.2 Supporting Research: Promptfoo

Date: 2026-09-07. Lane: incumbent only; bounded CE Step 3 support, not story approval.

## Recommendation and Evidence

**Inference:** retain Promptfoo as the candidate evaluation runner, with a small fail-closed Nomad results checker. Start with offline deterministic regression; authorize bounded live A/B separately. Do not add a production dashboard or replace domain tests.

**Facts:** observed release `0.122.2`, dated 2026-08-28, commit `8905230`; its package declares MIT and Node `>=22.22.0`. This is an inspected tag, not a guarantee of the newest npm publication. GitHub release-list API returned 403; direct tagged source worked. Current documentation and tagged implementation are distinguished below. [Release](https://github.com/promptfoo/promptfoo/releases/tag/0.122.2), [tagged package](https://github.com/promptfoo/promptfoo/blob/0.122.2/package.json).

**Local facts:** `packages/prompts/promptfoo.yaml` nests provider/tests beneath a prompt and uses `assertions`, `json-schema`, and `thresholds.pass_rate`. `.github/workflows/ci.yml:95-96` only echoes a placeholder. No Promptfoo lockfile match or prompts package manifest was found. Root Node `>=20` is broader than the inspected package requirement. These are migration inputs, not executable evaluation evidence. Domain fixtures and formal Story 8.1 approval remain with main.

## Executable Shape

**Facts:** Node exports `evaluate`, returning an Eval with `toEvaluateSummary()`; TypeScript types are exported. A minimal ESM harness follows. It is source-checked and syntax-checked only, not installed, typechecked against a package, or executed. After approved dependency pinning, it is intended for `node smoke.mjs`; the deliberately bad candidate should exit 1. This is runner-contract evidence, not a Nomad quality fixture. [Node API](https://www.promptfoo.dev/docs/usage/node-api-reference/).

```javascript
import { evaluate } from 'promptfoo';

const run = await evaluate({
  sharing: false,
  writeLatestResults: false,
  prompts: [
    { label: 'baseline', raw: '{"n":1}' },
    { label: 'candidate', raw: '{"n":0}' },
  ],
  providers: [{
    id: () => 'fixture',
    callApi: async (prompt) => ({ output: prompt }),
  }],
  tests: [{
    description: 'n must remain one',
    assert: [
      { type: 'is-json', value: {
        type: 'object', required: ['n'], additionalProperties: false,
        properties: { n: { type: 'integer' } },
      } },
      { type: 'javascript', value: (output) => JSON.parse(output).n === 1 },
    ],
  }],
}, { cache: false, repeat: 1, maxConcurrency: 1 });
const summary = await run.toEvaluateSummary();
process.exitCode = summary.results.length === 2
  && summary.stats.errors === 0 && summary.stats.failures === 0
  && summary.results.every((result) => result.success) ? 0 : 1;
```

For YAML, use top-level `prompts`, `providers`, `tests`, then `assert`; JSON Schema belongs under `is-json.value`, optionally `file://...schema.json`. Custom JavaScript can reuse reviewed assertion modules. Use booleans or explicit `{pass, score, reason}` for hard checks; label numeric scores and thresholds deliberately. **Fact:** test-level/`assert-set` thresholds can override individual failures through weighted scoring; zero-weight assertions cannot be hard gates. **Inference:** put critical invariants in an independent all-pass suite; LLM-rubric/weighted quality scores remain advisory or separately gated, never compensating for hard failures. Pin grader model/rubric and calibrate against human labels. [Assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/).

## Comparison and Resource Bounds

**Facts:** the configuration supports prompt/provider/test matrices, provider-prompt restrictions, repeat, cache, concurrency, delay, per-call and total timeouts. Custom providers return output/error, optional token usage, cost and cache metadata. Cost assertions require cost information. [Configuration reference](https://www.promptfoo.dev/docs/configuration/reference/).

**Inference:** compare identical fixture IDs across immutable baseline/candidate manifests. Two prompts, two providers, N cases and R repeats produce up to `4*N*R` cells; restrict pairings when comparing two bundled versions. Record source commit, prompt/schema/assertion/dataset hashes, provider route/model revision, generation parameters, grader revision, timezone/clock and external-fact snapshots. Require the exact cell-key set, not just aggregate counts.

Separate frozen-output replay from fresh model sampling. Cache hits prove replay, not new quality or latency; use isolated version/run cache directories and explicit cache policy. Repeat with cache disabled for fresh sampling; temperature/seed are not guarantees of provider determinism. Explicitly bound concurrency, delays, retries, output tokens, per-call/whole-job time and matrix size. Rate-limit behavior and cancellation vary by adapter. Cost assertions are post-response checks, not spending caps: include graders/retries in estimates and enforce an external budget; missing cost is unknown, not zero. RAM/disk/time needs require a bounded local pilot, not guessed sizing.

## CI Regression Fact

**Tagged code fact:** `src/node/doEval.ts:978-979` computes pass rate using successes + failures + errors. Lines 1204-1218 compare that rate with `PROMPTFOO_PASS_RATE_THRESHOLD`, falling back to 100, and set the configurable failure exit code. Thus 99 successes + 1 execution error at threshold 99 do not fail this branch. Library calls do not inherit that CLI gate. A zero denominator produces NaN in this calculation; end-to-end empty-selection behavior remains unverified. [Tagged gate source](https://github.com/promptfoo/promptfoo/blob/0.122.2/src/node/doEval.ts).

**Proposed regression tests:** mixed success/error at a permissive threshold must still fail Nomad's checker; also probe all-errors, missing/filtered/skipped cells, empty selection, assertion exceptions, timeout/interruption, missing artifacts and attempted exit-code override. Do not classify every provider error as process exit 1: CLI documentation describes failure code 100 and other errors 1, while recorded evaluation errors participate in the rate calculation. Explicitly set threshold 100 and failure code 100; inspect results independently. JSON/JSONL, HTML and JUnit outputs are supported. Preserve sanitized artifacts on failure without masking the original exit status. [CLI](https://www.promptfoo.dev/docs/usage/command-line/).

## Privacy, Hosting and Remaining Gates

**Fact:** configurations, referenced scripts, transforms and hooks execute unsandboxed with user permissions. Reports/exports are not sanitization boundaries. **Recommendation:** isolated least-privilege CI, no secrets on untrusted PRs, reviewed modules, no data interpolation into executable assertion strings, allowlisted egress, synthetic/redacted fixtures, and separate restricted artifact/cache/log storage. Disable sharing, telemetry, updates and unwanted hosted paths explicitly; verify actual egress and retention. `sharing:false` alone is neither a firewall nor complete deletion. [Tagged security model](https://github.com/promptfoo/promptfoo/blob/0.122.2/SECURITY.md).

**Facts:** basic self-hosting uses SQLite, lacks built-in authentication/SSO/RBAC and horizontal scaling, and is explicitly not recommended for production. Enterprise offers managed SaaS or on-prem with RBAC/team features. [Self-hosting](https://www.promptfoo.dev/docs/usage/self-hosting/), [Enterprise](https://www.promptfoo.dev/docs/enterprise/).

**Tradeoff:** mature matrices/assertions and MIT local execution reduce runner work; deterministic domain checks, manifest comparison, secure artifact governance and real spend controls still belong to Nomad. Managed governance adds commercial dependency; OSS hosting adds operational burden.

**Unverified adoption gates:** approved story/fixture scope; exact pinned package and WSL/CI compatibility; schema dialect and adapter fidelity; observed skip/error/timeout semantics; cache/repeat isolation; provider/grader cost and rate limits; artifact redaction/access/deletion; managed price, quotas, region and retention terms. No installations, provider calls, secret reads, business changes, account creation or deployment were performed. Only this report was saved.
