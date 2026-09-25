# Story 7.4 Account Export Recovery R1

Status: approved-with-story-7.4 (2026-09-06); text contract governs snapshot retry and actual retention.
Tool: built-in image_gen.
Saved asset: story-7-4-account-export-recovery-r1.png
Text contract: ../../planning-artifacts/story-7-4-review-2026-09-06.md
Dates/size are examples, not measured values or a retention-policy commitment.

## Prompt

Use case: ui-mockup. Create a Chinese high-fidelity mobile review board with exactly THREE phones side by side, white landscape canvas, same clean white/black/forest-green visual language as supplied account-export board. Board title outside "Story 7.4 | 失败与恢复". No Nomad badge, quotas/limits/costs, provider names, image export, album permissions or marketing art. Compact header/back chevron, icon-led commands, thin neutral separators, readable Chinese, no nested cards. Modest amber/red failure accents only; every state has text, not color alone.

Phone A outside label "生成失败". Inside header "账号数据副本". Modest alert icon and title "暂时无法生成数据副本". Text "已保存的行程和灵感不受影响". Show no file or download action and no success tick. Green button with refresh icon "重试生成", neutral "返回设置". Failure is actual terminal generation failure, not just leaving the page or network read failure.

Phone B outside label "文件过期". Inside header "账号数据副本". Neutral clock icon and title "下载已过期". Simple file outline item "nomad-account-20260906.zip", neutral metadata "数据截至 9月6日 14:30", "下载有效至 9月13日 14:31". These are OLD EXPIRED example times and not a policy promise. Below "重新生成当前数据的副本". Green button refresh icon "重新生成". Old download control omitted/disabled; no revived signed link or automatic task. No claim that original account data is deleted. No quota/reset data.

Phone C outside label "下载重试". Inside header "账号数据副本". Green tick and title "数据副本已生成". Same file with archive icon "nomad-account-20260906.zip", "1.2 MB". Metadata "数据截至 9月6日 14:30". A small amber inline message with alert icon "下载请求失败，请重试". Green button download icon "重试下载". Secondary "返回设置". Do not label the export task failed and do not regenerate the archive merely because download request failed. Do not claim file saved on device or use fake successful browser-download detection.

Outside under A: "只在真实任务失败时出现；重试沿用已固定的数据快照". Under B: "主动重新申请，生成新的数据快照". Under C: "副本仍有效时下载同一文件，不重新打包". Tiny outside footer "下载失败示意应用可检测的请求错误；浏览器保存结果未知时不宣称成功。日期与大小为示例。" Keep exact clear copy, fully fitting all texts/buttons within phones. Deliver one review board.
