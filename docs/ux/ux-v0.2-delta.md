# nomad-mvp UX v0.2 Delta

Date: 2025-10-27
Owner: UX
Refs: PRD v0.2 (`docs/prd.md`), Mobile IA v0.1 (`docs/ux/mobile-ia.md`)

## Scope

This delta documents UX changes introduced in PRD v0.2. It augments the Mobile IA (v0.1) without replacing it. Engineering and QA should use this as the authoritative source for UI behavior updates tied to the new AI seed/AnchorPool and skeleton SSE phases.

## Summary of UX Changes

- Skeleton shows seed block badge and a one-time tip: “已为你预排 N 个（均可修改）”.
- Candidate drawer labels source (用户候选/AnchorPool) and displays “为何推荐” ≤ 16 chars.
- Provide 5–8s global undo toast and an “一键重置预布局” action.
- Cold-start (0 selection) guarantees at least 1 seed when S_left ≥ 1.
- Surface skeleton generation SSE phases to users via lightweight status.

---

## 1) Seed Visibility on Skeleton

Screen: 天级骨架（PlanTimelineMobile）

- Seed badge on blocks: show a compact tag “AI 预排” on blocks with `origin=ai_seed`.
  - Placement: block header, right of title; 12–13px cap height; subtle accent color.
  - States: default, pressed; hidden when block enters edit mode to reduce clutter.
- Tip banner (one-time per generation):
  - Copy: “已为你预排 N 个（均可修改）”
  - Placement: skeleton header below title; dismissible “×”; auto-hide after 6s.
  - Behavior: shown after SSE `done`; persists only for current session unless dismissed.
- Telemetry: `seed_tip_show(seed_count)`, `seed_tip_dismiss`, `seed_block_edit(seed=true)`.

## 2) Candidate Drawer: Source & Reason

Screen: 空槽 → 大弹窗 → 候选抽屉（SlotSuggesterList）

- Source label:
  - Chip before title: “来自 用户候选” | “来自 AnchorPool”
  - Do not show scores/distances/confidence.
- Why short (“为何推荐”):
  - Truncate to ≤ 16 chars; single-line, secondary text.
  - Examples: “时窗贴合”, “距离更近”, “人气更高”.
- Sorting signal (visual only, no numbers): time-window fit > distance > vibe > popularity.
- Telemetry: `candidate_source` (user|anchor), `candidate_reason_short`.

### Edge Behavior: Too-far Slots (跨簇过远)

- For slots skipped due to `too_far` (跨簇通勤超限)，不要自动产出替代；槽位保持为空。
- 引导放入 FixSheet（而非自动候选）：提供“换近邻 / 挪日 / 缩短时长”等可执行建议。
- 候选抽屉不因 `too_far` 自动插入替代项，避免与可行性校验规则冲突。

## 3) Global Undo (5–8s) & Reset Prelayout

Contexts: 插入/替换/移动/删除、预排落位与撤销、seed 操作

- Global undo toast:
  - Copy: “已应用 · 撤销” with countdown 5–8s (default 6s). Only one toast at a time; refresh duration on new action.
  - Undo scope: reverses the last atomic action; chainable via当日“最近操作”。
- One-click reset prelayout:
  - Entry: HeaderBar More(…) menu → “重置预布局”；二次确认。
  - Scope: revert to pre-seed snapshot; keep manual edit history; only affects `origin=ai_seed` inserts/moves.
- Telemetry: `undo_toast_show(kind)`, `undo_apply`, `seed_reset_confirm`, `seed_reset_done`.

## 4) Cold-start Template (0 Selection)

Trigger: POST /plan/generate with `selected_items=[]` and `S_left ≥ 1`.

- Guarantee: place at least 1 seed block on the first day (policy per PRD).
- Copy (tip banner): “已为你预排 1 个推荐点（均可修改）”。
- Fallbacks:
  - AnchorPool unavailable → use built-in Top-50; log fallback.
  - If no viable candidate passes constraints → show empty state and suggest “自由活动”。
- Telemetry: `seed_coldstart_used`, `seed_coldstart_fallback(anchorpool=false)`.

## 5) Skeleton SSE Progress (User Transparency)

Phases: `started → freeze → must_go → quota → candidates → place → validate → persist → done`

UI Options (choose one per experiment flag):

1. Header breadcrumb (default): compact pills update inline.
2. Ephemeral toasts (quiet mode): only key milestones.

Copy mapping:

- started: “正在生成骨架…”
- freeze: “已冻结指定时段”
- must_go: “必去优先落位”
- quota: “已计算预排额度”
- candidates: “候选已就绪”
- place: “正在预排推荐点”
- validate: “正在校验可行性”
- persist: “保存中”
- done: “骨架生成完成”

Rules:

- Collapse rapid transitions; never stack more than 1 toast.
- Show max 3 messages in toast mode: started → place → done.
- Respect NFR2: avoid spinners with unknown durations; prefer discrete states.
- Telemetry: `skeleton_phase_seen(phase)`; durations derived from backend timestamps.
- anchors_ready（后端并行读取/准备 AnchorPool）并入“candidates: 候选已就绪”提示中，不单独对用户暴露技术事件。

---

## Microcopy (Additions)

- Seed tip: “已为你预排 N 个（均可修改）”
- Seed tip (cold-start): “已为你预排 1 个推荐点（均可修改）”
- Reset action: “重置预布局” / 二次确认：“确定重置为预布局前状态？”
- Source chip: “来自 用户候选” / “来自 AnchorPool”
- Why short label: “为何推荐” (prefix hidden; show value only)

## Acceptance Hooks (QA)

- Seed blocks visually distinguishable; tip appears after `done`.
- Candidate drawer shows source chip and ≤16-char reason.
- Undo toast persists 5–8s; reset prelayout reverts only `origin=ai_seed`.
- Cold-start places ≥1 seed when eligible.
- At least started/place/done phases surfaced to the user.

## Dev Handoff

- Components to touch:
  - PlanTimelineMobile: seed badge, tip banner, undo/reset integration points.
  - SlotSuggesterList: source chip + why_short, truncation rules.
  - HeaderBar (Planner pages): More(…) menu entry for reset.
  - Toast system: global single-instance countdown with refresh.
- Flags/Config:
  - `enable_ai_seed`, `planner_autoplace_v1` (remote)
  - SSE UI mode: `skeleton_sse_ui = breadcrumb|toast`
- Telemetry (proposed keys): see sections above; route to 友盟; include `plan_id`, `day_idx`, `slot_idx`, `poi_id` where applicable.

## QA Notes

- Verify no distances/scores shown in candidate drawer.
- Verify reset only affects `origin=ai_seed` changes; manual edits persist.
- Verify cold-start places ≥1 seed when `S_left ≥ 1` and AnchorPool available; fallback logged when not.

## PRD ↔ UX Mapping (v0.2)

- FR32/33/34 → Sections 1/2/3/4/5 (this document)
- Microcopy updates → add to Mobile IA §5 Microcopy
- SSE phases → Mobile IA new §10.1b Skeleton SSE


