# Story 8.2 Evaluation Report R1

Status: superseded-by-user-annotations (2026-09-07); retained historical synthetic example.
Replacement: story-8-2-evaluation-human-workspace-r2.png. The universal hard-gate and summary-only
direction below is no longer current; use per-rule policies and a real human-evaluation workflow.
Tool: built-in image_gen.
Original: /mnt/c/Users/123/.codex/generated_images/01a019f0-508b-71a3-80eb-2bb7436d7fd1/exec-9a0f738b-ceb0-4d21-b064-656e53a5e3a8.png

The two runs are different examples: run_demo_18 is complete but violates a hard rule;
run_demo_19 is incomplete. Scores/timings/counts are fictional, not Nomad benchmarks or limits.
Use local/restricted CI artifacts, not a new public backend or automatic model publishing UI.

## Prompt

Use case: ui-mockup. Generate a polished Chinese desktop evaluation REPORT review board in wide 1536x1024, three side-by-side annotated report panels, not mobile. White background, black text, restrained green/teal for pass and amber/red for blocked, 6px corners, compact utilitarian typography. No gradients, hero, photographs, brand logos, extra administration platform, deploy buttons, or real user content.
Title outside panels: "Story 8.2｜版本变好了吗？先看硬约束".
Subtitle: "报告示意 · 全部为合成数据 · 非新增后台".
Panel A header "A 版本对比". At top "运行 run_demo_18 · 已完成", "样本集 synthetic.v2 · 24 个样本", "模式：授权真实比较（示例）".
Comparison table 3 columns "指标 | 基准 v3 | 候选 v4":
"硬约束通过 | 24/24 | 23/24"
"语义评分（参考） | 4.2/5 | 4.5/5"
"调用耗时（中位数） | 3.1s | 2.8s"
"调用成本 | 未报告 | 未报告".
Under table large restrained red status "门禁不通过", then "1 个硬约束失败，不能用高分抵消".
Plain artifact links row with small file icons "JSON 结果   可读报告". No deployment action.
Outside annotation under A: "同一批样本、同一套规则".
Panel B header "B 查看失败样本". At top "run_demo_18 · booking-03". Then amber small text "预约时间不可移动". Clean before/after two columns with clock icons: "预期 09:00" and "候选 09:30". Red line "候选改动了冻结时间".
Then small unframed metadata:
"规则 freeze-window.v1"
"样本来源 合成"
"基准 通过"
"候选 硬失败".
A green text link "返回版本对比". Outside annotation under B "规则检查优先于模型评分".
Panel C header "C 执行未完成". At top "运行 run_demo_19 · 已中断". Neutral amber icon and title "本次比较尚无有效结论". List "计划样本 24" "已执行 10" "未执行 14" "原因：Provider 超时". Calm text "已完成的结果保留" and "重试关联原样本与版本". Small neutral link with history icon "查看本次记录". Do not show a passing score or say model got worse. Outside annotation under C "没有测完，不代表通过或质量变差".
At bottom one unframed annotation strip: "确定性 CI 不调用模型   |   真实比较需授权   |   评测通过不会自动发布".
Keep all Chinese labels legible, do not invent more buttons, charts, features or numeric scores. Ensure no overlap and no cropped table text. The report is synthetic and indicative of mature-tool outputs, not a claimed faithful screenshot of Promptfoo or Langfuse.
