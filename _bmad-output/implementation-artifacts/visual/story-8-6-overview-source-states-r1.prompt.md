# story-8-6-overview-source-states-r1

Status: approved with Story 8.6 (2026-09-13); synthetic, not a deployed dashboard.
Tool: built-in image_gen.
Selected original: /mnt/c/Users/123/.codex/generated_images/01a09678-26d9-7c00-a780-8da933702cd2/exec-95a077a3-08af-42aa-bedf-ad9168b0a2fe.png

Three independent examples: one stale observation source with current PG data, a verified empty business window with an independent historical quality report, and a denied new environment with old data removed. Not production results.

No production data, credentials or real monitoring connections were used. Desktop Web only.

## Generation prompt

Use case: ui-mockup.
Generate a Chinese desktop Web operations review board, landscape 1536x1024, three side-by-side desktop page excerpts. White background, black Chinese sans-serif, flat tables and thin gray separators, blue links, amber stale/partial states, red only permission refusal. No phones, mobile navigation, marketing, gradients, public dashboards, or secret values.
Outer title "Story 8.6｜来源异常、空数据与权限". Subtitle "桌面只读提案 · 三个独立合成场景，待审".
Panel A outer caption "A 一个来源失败，其他仍可查看". App header "运营总览 · 生产". Small window "今日 00:00—14:00". Amber section "观测来源暂时不可用". Value "P95 11.8 秒（旧值）". Detail "缓存数据截至 13:30" and "不能视为当前耗时". Outline button "重试此来源"; blue link "在 Langfuse 查看". Divider. Budget section "预算账本 · 截至 14:00", value "可新预留 $2.00", small "当前预算来源可用". Incident section "告警事件 · 截至 14:00", value "1 个事件仍需处理", link "查看事件". Outside note "旧值标明时间，不把查询失败变成零".
Panel B caption "B 确认窗口为空，也不等于健康". App header "任务统计 · 生产". Small window "今日 00:00—14:00". Neutral status "查询成功 · 该窗口已完整覆盖". Table "终态任务  0", "完成率  —", "执行耗时  —". Readable explanation "暂无可计算的完成率" and "暂无有效耗时样本". Divider. Quality section "质量报告使用独立版本", "报告 eval-32 · 09-12 18:00", link "查看封存报告". No green health badge. Outside note "当前窗口为空，不清空历史报告或宣称正常".
Panel C caption "C 切换环境，先核对权限". App header "运营总览". Selected environment control "测试". Red plain status "无此环境查看权限". Explanation "当前账号不能读取测试环境" and "此前生产数据已隐藏". Large otherwise empty content area with neutral placeholder "本环境数据未加载". Outlined button "返回生产". Secondary note "不会以旧环境数据填充新页面". Outside note "迟到响应与旧缓存不能跨环境显示".
Footer outside all views "来源状态与服务状态分开；目标工具独立鉴权。刷新只读，不发起模型调用或测试消息。"
All values, reports, environments and times are synthetic examples. Do not add publishing, fixing, retries of business jobs, arbitrary SQL editors, public sharing, anonymous iframe or real credentials. Crisp legible Chinese with enough whitespace and no clipped text.
