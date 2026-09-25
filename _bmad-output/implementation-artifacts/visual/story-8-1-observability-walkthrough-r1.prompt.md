# Story 8.1 Observability Walkthrough R1

Status: approved-with-story-8.1 (2026-09-07); conceptual walkthrough, not a vendor screenshot or a new Nomad UI.
Tool: built-in image_gen; one generation and one correction; originals retained.
Original: /mnt/c/Users/123/.codex/generated_images/01a019f0-508b-71a3-80eb-2bb7436d7fd1/exec-9695e9ab-29f9-4fef-a8e5-4b4e084949e4.png
Selected: /mnt/c/Users/123/.codex/generated_images/01a019f0-508b-71a3-80eb-2bb7436d7fd1/exec-15192a73-aa7a-421d-aff1-1069ec561958.png

The selected error belongs to attempt 1; attempt 2 succeeds. IDs, metric values and error labels
are illustrative, not wire-format commitments. No new Nomad admin panel, recording of user inputs,
vendor UI parity, deployment success or Telegram integration is authorized by this board.

## Initial Prompt

Use case: ui-mockup. Create one high-fidelity Chinese annotated DESKTOP operations walkthrough board, wide 1536x1024. This is a CONCEPTUAL RESEARCH REVIEW illustration, NOT a recreation or screenshot of an actual vendor, and NOT a new Nomad admin UI. White background, black legible Chinese typography, restrained teal/green highlights and one amber error accent, tightly organized utility-tool layout with squared 6px corners. No phones, marketing hero, gradients, private user data, scenery or brand logos.
Exact large outside title: "Story 8.1｜从错误定位到 AI 调用".
Outside subtitle: "运营排障示意 · 非已部署页面 · 不新增 Nomad 后台".
Three left-to-right unframed clearly numbered sections with two readable desktop tool windows and a small status example on the right:
A heading "① 定位错误（Sentry）". Tool window simple safe error list and selected event:
"环境 staging"; "能力 行程规划"; "PLAN_PROVIDER_TIMEOUT"; "任务 job_demo_17"; "关联编号 corr_demo_42"; "尝试 2"; "版本 plan_rev_demo"; "耗时 20.0s"; "失败阶段 arranging".
Highlight the correlation id in green, show a small copy icon beside it. Outside orange annotation: "只看错误与版本，不看用户行程原文".
A thin arrow from the safe correlation field to B, outside label "使用同一关联编号查询".
B heading "② 查看 AI 调用（Langfuse）". Tool window trace tree using lines/icons with exact entries:
"job_demo_17"
"  attempt 1 · 超时"
"  attempt 2 · 已完成"
"  validating · 已通过"
"  persisting · 已发布".
Under tree a plain metadata grid: "提示版本 planner.v3"; "模型版本 model_demo"; "输入 token 3200"; "输出 token 未报告"; "最终结果 回退后完成".
No request/response text, prompts, user id, POI names, hotel names, route, URL or secrets. Outside note "一次尝试失败 ≠ 整个任务失败".
C heading "③ 观测失联". Smaller plain status area "观测服务暂不可用" in neutral amber, then "行程任务仍按原规则运行", "遥测有界重试或丢弃", "不额外发起 AI 规划", "未采集的数据不记为 0".
At bottom a single unframed annotation band with three readable items:
"只在授权运维工具中查询"
"默认不录屏、不采集完整输入输出"
"Telegram 告警属于 Story 8.5".
Leave ample margins and avoid any overlap or truncated labels. All content synthetic, top subtitle clear. Show understandable workflow, not exact third-party product styling. Do not add a save/publish/deploy action or any claim of current integration success.

## Correction Prompt

Edit only one small text value in the attached conceptual operations walkthrough. In the LEFT window's selected event detail table near the bottom, change the value for the row labeled 尝试 from 2 to 1. It must read 尝试 1 so it agrees with the middle tree where attempt 1 timed out and attempt 2 completed. Preserve every other pixel/layout/title/Chinese annotation/column/data value and all stylistic details. Do not modify the middle attempt 2 completed row. No other changes.
