# story-8-4-budget-policy-usage-r1

Status: approved with revised Story 8.4 (2026-09-13); synthetic, not deployed UI.
Approval scope: base board plus desktop Web and amount-source text clarification; missing source/price-entry states still need implementation evidence.
Tool: built-in image_gen.
Original: /mnt/c/Users/123/.codex/generated_images/01a09678-26d9-7c00-a780-8da933702cd2/exec-23b98998-1272-491c-81f8-c8e565c41ae0.png

All numbers, connections, operation IDs and statuses are illustrative, not production limits.
Scope: internal operator surface only. No change to approved Story 8.3 or user Settings.

## Prompt

Use case: ui-mockup.
Generate a polished Chinese desktop operations prototype board, wide 1536x1024, three side-by-side compact software views. White background, black Chinese sans serif text, emerald primary buttons, blue links, amber pending, small 6px corners, thin gray lines and flat tables. No gradients, marketing, card nesting, vendor branding, mobile phones or travel-user Settings. This is a proposed narrow Nomad operator interface, not a real deployed screenshot.
Outer title "Story 8.4｜预算策略与用量核对". Subtitle outside UI "内部运营页提案 · 金额、次数、版本均为合成示例，待审".
Panel A caption "A 编辑预算草稿". App title "预算策略" environment "生产". Status "当前 b7 · 未发布草稿". Read-only scope "平台 / AI 调用". Field "每日成本上限" input "15.00" suffix "USD"; helper "当前 20.00 USD". Field "并发调用上限" input "3"; helper "当前 4". Read-only window "自然日 · Asia/Shanghai". Separate compact task quota section "初始规划 · 每用户" numeric field "每日任务上限 40", helper "当前 60 · 同一任务的内部重试不重复计次". Small secondary link "其他策略：高德请求 / 导出任务". Bottom buttons "保存草稿" outline and "检查策略" emerald.
Panel B caption "B 发布前核对影响". Title "发布生产策略". Version "b7 → b8". Diff table "策略 | 当前 | 修改后": "每日成本 | $20 | $15"; "并发调用 | 4 | 3"; "每用户规划 | 60 | 40". Below text "当前已计费用与保守占用 $13.00". A green check "结构检查通过". Impact lines "新外发调用按 b8 重新检查" and "已外发请求继续核对费用" and "累计用量不清零". Small note "已有任务保留原模型路线". Bottom controls "返回修改" outline and "确认发布" emerald.
Panel C caption "C 核对用量事实". App title "预算用量 · 生产". Status "当前 b8 · 统计到 09:42". Date "2026-09-13 · Asia/Shanghai". Flat money fact table with five rows exactly: "已确认费用 | $8.20"; "暂估结算 | $0.80"; "未发出预留 | $1.50"; "在途 / 待核对占用 | $2.50"; "占用合计 | $13.00". Divider, strong figure "可新预留 $2.00". Small note "已扣除预留与未知占用". Amber inline "2 笔费用待核对" with blue link "查看明细". Buttons "刷新用量" outline and "查看策略记录" text. No generic accuracy or fully-synced claim. Do not label unknown amounts as actual charges.
Outside annotations under A "保存不会修改生效策略"; under B "收紧预算不取消已外发请求"; under C "未知费用保留占用，不能记作零".
Footer outside UI "仅运营者可见；旅行者仍在原页面查看任务、重试或手动编辑。示例阈值不是生产默认值。"
C arithmetic must be exactly 8.20 + 0.80 + 1.50 + 2.50 = 13.00; 15 - 13 = 2.00. Keep concise readable Chinese, ample whitespace, no clipping. All shown data synthetic.
