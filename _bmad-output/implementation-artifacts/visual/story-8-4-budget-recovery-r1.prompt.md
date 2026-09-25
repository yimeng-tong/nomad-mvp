# story-8-4-budget-recovery-r1

Status: approved with revised Story 8.4 (2026-09-13); synthetic, not deployed UI.
Approval scope: base board plus desktop Web and amount-source text clarification; missing source/price-entry states still need implementation evidence.
Tool: built-in image_gen.

All numbers, connections, operation IDs and statuses are illustrative, not production limits.
Scope: internal operator surface only. No change to approved Story 8.3 or user Settings.

## Prompt

Use case: ui-mockup.
Generate a polished Chinese desktop operations prototype board, landscape 1536x1024 with four compact views in a two-by-two grid. Use white background, black clear Chinese sans serif, thin gray lines, flat tables, restrained emerald buttons, blue links, amber unknown/pending. Same quiet operations design as a narrow Nomad admin console. Not a vendor screenshot. No phones, user settings, marketing, graphs, gradients, credit top-ups or Telegram.
Outer title "Story 8.4｜未知费用与恢复". Subtitle "内部运营页提案 · 四个独立合成场景，待审".
Top-left panel caption "A 请求超时，费用仍待核对". App header "用量明细 · 生产". Two column fact rows "调用编号  attempt-72", "请求结果  超时", "实际费用  未知", "保守占用  $1.50". Amber status "待核对 · 占用仍保留". Explanation "超时不代表上游未收费". Bottom blue-outline action "刷新对账状态". Small note "刷新只查询记录，不重发模型请求". No release/zero-charge button and no checkmark implying no charge.
Top-right panel caption "B 预算收紧后，停止新外发". Header "预算用量 · 生产 · b9". Compact facts "当前日上限  $10.00", "已计费用与在途占用  $11.50", "可新预留  $0.00". Amber "超出当前上限 $1.50". Text "未发出预留已重新核验" and "已外发请求继续结算". Bottom links "查看占用明细" and "编辑策略". Footnote "放宽预算不会重启已结束任务". No reset-balance button, no promise cancel sent calls, no user quota CTA.
Bottom-left panel caption "C 发布结果未知，恢复原操作". Header "预算策略 · 生产". Show pending "正在核实发布结果". Rows "操作编号  op-91", "申请版本  b8 → b9". Text "连接中断，尚不能确认是否生效" and "草稿与原操作已保留". Bottom primary button "核实原操作" with search icon and secondary "返回策略". Tiny note "不重复新建发布，不先显示成功". No spinner that never exits, no second publish action.
Bottom-right panel caption "D 账本失联，保留最后读数". Header "预算用量 · 生产". Amber status "当前数据不可验证". Muted fact "最后成功读取  09:42" and "历史可新预留  $2.00（已过期）". Crucial text "该读数不可用于新调用授权" and "新付费外发暂不可用". Bottom outline "重新读取" and disabled gray "发布策略". Small note "已发出请求保留记录，恢复后继续核对". No fake zero, no healthy/synced status.
Outside footer "原型不表示真实账单或部署状态。额度仅内部可见；已有行程与安全的手动操作保留。"
All monetary amounts are USD examples and every number is synthetic. Keep content concise, aligned and readable without clipping. Do not add production defaults, a global control center, user billing UI or secret values.


## Final selection and text correction

Selected output: /mnt/c/Users/123/.codex/generated_images/01a09678-26d9-7c00-a780-8da933702cd2/exec-af42565f-5c56-40e7-a506-069b3e83fc36.png
First generation: /mnt/c/Users/123/.codex/generated_images/01a09678-26d9-7c00-a780-8da933702cd2/exec-0ce89caa-7e66-41b5-ad87-7bd24a79923a.png
The selected R1 corrects C to an idle unknown-result state; no active request is claimed while the manual check button is enabled. The first generated candidate remains in the built-in output directory and is not the registered project asset.

### Edit prompt (built-in image_gen)

Edit the supplied Story 8.4 Chinese operations prototype image. Change ONLY the amber status text in bottom-left panel C from "正在核实发布结果" to "发布结果待核实". This is an idle unknown-result state awaiting the manual "核实原操作" button, not an active request. Preserve everything else exactly: all four panels, their positions, fonts, colors, tables, amounts, op-91, b8 → b9, buttons, footnotes and dimensions. Do not change the other three panels or add anything.
