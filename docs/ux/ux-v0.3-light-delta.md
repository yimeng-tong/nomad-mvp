# nomad-mvp UX v0.3-light Delta (MVP)

Date: 2025-10-28
Owner: UX
Refs: PRD v0.3-light (`docs/prd.md`), Mobile IA (`docs/ux/mobile-ia.md`), v0.2 Delta (`docs/ux/ux-v0.2-delta.md`)

## Scope

This delta specifies UX changes required for the MVP (v0.3-light). It builds on v0.2 and introduces ResultSheet, FR44‑lite search, hotel_slot (display-only), near_hotel hints, and BYOK visibility. Multi-city/transport/history timeline are not exposed.

## 1) IA & Navigation

- Add ResultSheet page after AI Fill: Skeleton → AI Fill → ResultSheet (read-only + light edit).
- ProgressBreadcrumb: 灵感✔︎ / 骨架✔︎ / AI填充✔︎ / 行程单•
- Hide multi_city/transport/history timeline entries.
- Home 增加“最近行程”入口：在首页内容顶部展示最近一次计划（进行中/已完成），提供“继续编辑/查看行程单” CTA。

## 2) ResultSheet

- Per-day grouped read-only view; each slot shows 做什么/准备/注意.
- Light edit per slot: ≤3×30 chars per field; “恢复 AI 内容（单槽重置）”。
- Export PNG from this page; show feasibility fix summary before export.
- Visiting ResultSheet marks plan as completed.
- Slot Check-in：每个槽位右侧提供「打卡 <> 已打卡」切换；无网排队提示“稍后同步”；时间线与结果页一致显示状态对勾。
- BYOK Counter：导出区域显示「免费导出次数：N」；N ≤ 3 显示软提醒；N = 0 显示 BYOK 教育条并跳转设置页。

## 3) Skeleton

- Keep seed badge and one-time tip.
- Global undo 5–8s; More → “重置预布局”（seed-only scope）。
- near_hotel (when hotel selected): reasons like “靠近酒店/回程方便”; no distance/score/confidence.
- too_far slots: no automatic replacements; FixSheet suggests “换近邻/挪日/缩短时长”。

## 4) Slot Modal — FR44‑lite Search

- Top text search (AMap), returns Top‑5 list (no map).
- Actions: add to candidates | place directly (respect hard constraints/segment boundaries).
- Coexists with 候选抽屉/AI 建议/自由活动; list shows only ≤16-char “为何推荐”。
- Failure: “搜索暂不可用，请稍后重试”。

## 5) Hotel Slot (display-only)

- Fixed region at end of DayN timeline; not part of 2h scheduling; highlighted in ResultSheet.
- Hotel selection modal uses FR44‑lite search (Top‑5, no map); select writes to hotel_slot; no “留空”。
- No auto-replan on choose/change in MVP.

## 6) BYOK Visibility

- ResultSheet/export header bar shows free export counts; ≤3 soft reminder; 0 → BYOK education.
- Default channel is platform credits; BYOK is optional enhancement.
  - 文案：N ≤ 3：“剩余免费导出次数不多，建议尽快完成或配置 BYOK。”；N = 0：“已用尽免费导出次数。你可以配置 BYOK 继续导出。”

## 7) Microcopy

- ResultSheet: “行程单 · 只读预览（可轻编辑）”；“导出前请检查可行性与修复建议”。
- Slot edit placeholders: “在此补充你的做法/准备/注意（≤30字/行，最多3行）”。
- Reset: “恢复 AI 内容”；Confirm: “确定将此槽位恢复为 AI 生成内容？”
- Search placeholder: “搜索地点或类别（Top‑5）”；Failure: “搜索暂不可用，请稍后重试”。
- Reasons: “时窗贴合/距离更近/人气更高/靠近酒店”。
 - Check-in："打卡" / "已打卡"
 - 最近行程入口："继续上次行程"
 - BYOK：N ≤ 3 提醒文案；N = 0 教育文案

## 8) Telemetry & Flags

- New: resultsheet_open, resultsheet_export_click, slot_edit_apply, slot_edit_reset_ai,
  search_open, search_submit, search_result_click, candidate_reason_source,
  slot_check_toggle, ai_fill_citation_open, ai_fill_citation_missing, byok_prompt_open, byok_prompt_confirm, recent_plan_open。
- Keep: seed_*, skeleton_phase_seen, undo_toast_show/undo_apply, seed_reset_*.
- Flags: skeleton_sse_ui=breadcrumb|toast, fr44lite_enabled=true|false.

## 9) QA Hooks

- ResultSheet light edit limits; single-slot reset works; pre-export fix summary visible.
- FR44‑lite: Top‑5 no map; failure message; direct placement respects constraints.
- hotel_slot fixed at DayN end; selection persists; no auto-replan.
- Candidate drawer: no distance/score/confidence; “为何推荐” ≤16 chars; near_hotel only explanatory.
 - Check-in：状态切换持久化；离线排队提示；时间线与结果页一致。

## 10) AI Fill — Citations & Why

- 每个槽位显示 why_short（≤16 字）与来源短链（AMap/官方/UGC 等），点击可在 WebView 打开；禁止内嵌回退系统浏览器。
- 当「做什么」缺少来源时，显示浅色徽标“注意事实核查”。
- 可访问性：提供聚焦朗读（原因与来源）。
- Telemetry：ai_fill_citation_open, ai_fill_citation_missing。
