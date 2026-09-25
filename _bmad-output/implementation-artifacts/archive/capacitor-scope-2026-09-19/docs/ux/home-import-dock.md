# Home Import Dock UX Contract

Status: Approved Correct Course
Updated: 2026-08-12
Primary visual: `story-1-4-home-import-queue-r4.png`
Earlier visual baseline: `story-1-4-home-hybrid-r3.png`

This contract scopes future Story 1.6. It refines the completed Story 1.4 Home
surface and does not belong to active Story 2.2. Text behavior and OpenAPI win
when a generated image implies unsupported data.

## Component Model

Import state and unified input form one bottom `HomeImportDock`, not two cards.
The queue panel, compact status, stage line, input, and action button share one
width, edge, elevation, and visual hierarchy.

- Input placeholder: `粘贴分享链接或输入想去的地点，如：厦门 3天`.
- Empty input uses a `+` icon button; non-empty input transitions to paper-plane.
- Input remains available while existing jobs run, subject to abuse/rate limits.
- Expanded queue uses a down chevron and downward drag to collapse.
- Compact queue uses an up chevron to expand; only expanded state has a handle.
- A source title is the primary line and truncates safely without hiding `N/X`.
- The secondary line is one current factual action, never an invented percentage.

## Queue Semantics

- One paste may contain multiple supported links; every valid URL creates an
  owner-scoped single-link ingest job. Invalid fragments do not discard valid URLs.
- `N/X` identifies the currently presented job within the submission batch.
- Processing jobs may overlap. Presentation is serialized independently from
  processing so completion order cannot replace the visible completion result.
- Every completed job receives an uninterrupted ten-second compact success
  window. Later completions wait FIFO and then receive their own ten seconds.
- New submissions append jobs without creating another input or modal queue.
- Duplicate `user_id + normalized_url` returns the owner's existing record as an
  explicit duplicate result; it never exposes another user's record.

## Server-State Mapping

| Ingest event | User-facing stage |
| --- | --- |
| `created`, `fetching` | 获取内容 |
| `parsing` | 理解图文 |
| `geo` | 验证地点 |
| `storing` | 保存灵感 |
| `done` | 已导入 N 个灵感到{城市} |
| `failed` | 导入失败 |

The UI may expose stage order but not percent. Counts must come from persisted
event fields. Current parsing diagnostics are `media_prep`, `speech_detect`,
`frame_extract`, `asr` and `multimodal`; skipped stages remain honest. Legacy
`text/ocr/vision` events are read-only compatibility input, not the current extraction pipeline.

## Required States

1. Default empty composer.
2. Natural-language recognition: `识别 厦门 3天 7月14日出发`.
3. Multi-link queue running expanded and compact.
4. Per-item FIFO success with `查看` action.
5. Reconnecting with last durable stage retained.
6. Retriable failure with source title and retry action.
7. Terminal failure with acknowledgement and editable composer.
8. Owner duplicate record and mixed valid/invalid paste.

`查看` opens the authenticated Library import detail. It lists parsed POIs and
exposes the owner's original URL through a compact copy icon. There is no cancel
button until a real cancel endpoint and cancellation semantics exist.

## Accessibility and Motion

- `+`, send, chevron, retry, copy, and view controls have 44pt targets and labels.
- `N/X`, stage, and failure are announced as one concise live-region update;
  image-count churn is not announced continuously.
- The plus-to-send transition is 120-180ms; reduced motion swaps icons directly.
- Completion timers do not remove access to the durable Library record.

## Visual Coverage

Import Queue R4 covers the main queue, compact and completion behavior. The
error, reconnect, duplicate, mixed-input and accessibility states remain text
contracts and must be exercised in Story 1.6 tests or added as focused mockups.
