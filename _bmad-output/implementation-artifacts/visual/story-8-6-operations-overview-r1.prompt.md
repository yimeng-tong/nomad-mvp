# story-8-6-operations-overview-r1

Status: approved with Story 8.6 (2026-09-13); synthetic, not a deployed dashboard.
Tool: built-in image_gen.
Selected original: /mnt/c/Users/123/.codex/generated_images/01a09678-26d9-7c00-a780-8da933702cd2/exec-c8fca443-7c57-4d10-83ab-1832b9ad0449.png

Selected image includes 6 degraded/fallback-completed tasks as a subset of 112 completed tasks, not extra tasks. Cost arithmetic reuses the synthetic 8.4 illustration. Evaluation snapshot and per-source timestamps remain distinct.
First candidate: /mnt/c/Users/123/.codex/generated_images/01a09678-26d9-7c00-a780-8da933702cd2/exec-85636b59-ddc9-4776-aaf2-6e8ca0df7f99.png

## Edit prompt

Edit this supplied desktop overview image with exactly one content addition. In the top-left "任务结果" section, add the line "其中 6 个完成任务经历降级/回退" directly below "120 个终态任务 · 8 个失败", using a compact readable gray font. The 6 are a subset of the 112 completed tasks, not extra tasks. Adjust the link within that section slightly if needed to keep clear spacing, but preserve the card bounds. Preserve every other section, number, text, color, navigation, table and layout unchanged. Keep synthetic/proposed labels. Do not add a chart or an action button. This supplies the missing degradation summary in the read-only overview.

No production data, credentials or real monitoring connections were used. Desktop Web only.

## Generation prompt

Use case: ui-mockup.
Generate one polished Chinese desktop Web operations overview proposal, landscape 1536x1024. A full desktop page, no phone frames, no mobile UI, no marketing hero, no gradients, no decorative illustrations. White canvas, thin gray separators, black Chinese sans-serif, restrained blue read-only navigation, amber only for pending/unknown. Use flat sections and compact tables rather than deeply nested cards. Avoid an overall green 'all healthy' label.
Outer title "Story 8.6｜运营总览". Subtitle "桌面只读页面提案 · 全部数据为合成示例，待审".
Inside application: slim top navigation "运营总览" active, then link labels "模型路由", "预算策略", "告警事件". Top filter bar with controls "环境 生产", "业务窗口 今日 00:00—14:00", "能力 初始规划", outlined button "刷新". Note "各模块使用自己的来源与时间范围".
Upper row contains three equal readable summary sections.
Section 1 "任务结果": large "112 / 120 完成"; small "120 个终态任务 · 8 个失败"; link "查看业务统计"; footer source "任务记录 · 截至 14:00". No success percentage or user count.
Section 2 "执行耗时": values "P50 6.2 秒" and "P95 11.8 秒"; note "已观测 96 个任务 · 采样数据"; link "在观测工具查看"; footer "观测窗口 00:00—14:00 · 覆盖未核验". No charts inventing entire-population latency.
Section 3 "质量回归": "报告 eval-32"; "40 个样本 · 2 项待人工复核"; note "候选版本 E18 · 报告时间 09-12 18:00"; link "查看逐规则结果"; footer "封存评测报告 · 非线上全量质量".
Lower row left wider section "预算与成本 · USD". Show "预算账期 今日 · Asia/Shanghai"; compact table rows "已核对费用 $8.20", "按资费估算 $0.80", "未发出预留 $1.50", "在途 / 待核对 $2.50"; below "可新预留 $2.00 / 日上限 $15.00". Small note "内部预算，不是上游账户余额". Link "查看预算明细". Source "预算账本 · 截至 14:00".
Lower row right section "当前告警": amber line "1 个事件仍需处理". Table columns "事件 | 服务状态 | 通知状态", single row "INC-204 | 仍需处理 | 投递结果未知". Link "查看事件与投递". Source "当前事件状态 · 截至 14:00". Lower divider and compact "配置摘要": "路由已发布 r13 · 已观察到使用 r13"; "仍有旧任务使用 r12"; "预算策略 b8"; read-only link "查看配置详情".
Bottom slim source navigation "详细排障：Sentry ｜ Langfuse ｜ 评价工作区"; note "目标工具独立验证登录与权限".
Outer footer "页面只读；不发布策略、不重跑任务、不发送测试消息。示例数值不代表真实服务或生产阈值。"
Ensure all arithmetic is consistent: 8.20 + 0.80 + 1.50 + 2.50 = 13, and 15 - 13 = 2. Every amount is synthetic. Report date distinct from live window. No edit/delete/run/fix buttons, no secret keys, real data or user itineraries. Keep exact Chinese labels, spacious alignment and all text legible/unclipped.
