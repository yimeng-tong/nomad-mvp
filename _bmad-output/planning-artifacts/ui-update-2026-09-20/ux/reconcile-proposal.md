# Reconcile approved UI proposal

Input: `_bmad-output/planning-artifacts/sprint-change-proposal-ui-foundation-2026-09-19.md`; approval: `ui-foundation-scope-decision-2026-09-20.md`. The proposal's original pending wording is historical; the approval selects9.3–9.7 and the full browser matrix. It does not remove the1.7 stop boundary.

| Input concern | Applied destination | Reconciliation |
| --- | --- | --- |
| §1/§3 preserve business, layout, deep-green direction and18 prompt groups | front-end-spec Document Status/Shared UI; unchanged Product Experience/Core Flows | No visual rebrand, reset or new discovery. Existing18 rows and S0–S11 table mechanically unchanged. |
| §4.1 iOS16.4, Firefox128, WebSafari16.4; Chromium/Edge111,Android10/WebView111 | front-end-spec platform table andUX-DR36; mobile-ia§7; prototype-coverage new platform row | All are approved current minima; unsupported-platform message uses a lightweight page and only real supported alternatives. Device/browser evidence remains pending. |
| §4.2 component layers/source/cascade responsibility | front-end-spec Shared UI opening plus architecture cross-reference | Visual/behavioral consequences recorded here; exact dependency/source/layer rules remain architecture authority, avoiding duplicate technical ownership. |
| §5.1 tokens/basic components/states | front-end-spec semantic table and six component rows | Includes colors, fonts, spacing, radius, layer, motion, touch; Button/Field/Dialog/Tabs/Toast/Skeleton rules. No arbitrary new palette. Current CSS exceptions explicitly assigned for migration. |
| §5.2 AppSheet/Portal | front-end-spec eight numbered shared-modal rules; mobile-ia§8 | All eight concerns carried: identity, focus, inert/scroll, nested layer, host back, controlled dismissal, viewport/safe-area, visibility/ACK and real assistive evidence. ResultSheet remains a page. |
| §6 migration by Story | prototype-coverage new incremental matrix and subsequent-consumer matrix | All proposal page groups retained, including historical login/settings done, paused3.1, deferred7.2, desktop-only ops and9.1/9.2. New adapters never close domain stories automatically. |
| §7.1/7.2 Storybook/MSW/lint/Playwright | front-end-spec evidence paragraph; prototype-coverage9.4/9.5 rows | Reproducible states, negative checks, mock/product separation and screenshot/trace responsibilities included; precise CI implementation remains9.4/9.5/architecture responsibility. |
| §7.3/7.4 Query/Router | front-end-spec read-state/navigation section; mobile-ia§4/§5/§8 | Independently approved; only existing consumer reads/routes, identity-confirmed state, no auto mutation or privateURL/cache leaks, no fictitious future screens. |
| §7.5 RHF/Zod and existing observability | prototype-coverage subsequent-consumer rows |2.3 complex-form adoption remains conditional implementation detail; simple input/whole-backend schema not refactored. Existing Sentry/Langfuse UI not redrawn or duplicated. |
| §8–§10 source chain, evidence and execution boundaries | source links plus all three documents' closure language | Root owns catalog/delivery/fingerprints/mirrors/IR. Old evidence remains historical, real native gaps explicit, no automatic1.8/newStory dispatch. |

Dropped qualitative ideas: none within the approved UX change. Intentionally outside this subtask: library installation, current build-target changes, API/controller/route implementation, CI execution, source/Story catalog regeneration, new visual assets and automatic deployment. These remain assigned work, not silent omissions.
