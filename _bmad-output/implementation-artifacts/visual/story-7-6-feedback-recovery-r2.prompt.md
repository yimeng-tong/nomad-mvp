# Story 7.6 Feedback Recovery R2

Status: approved-with-story-7.6 (2026-09-07); annotations and text govern quiet controls and bounded recovery.
Tool: built-in image_gen, reference-image edit.
Saved asset: story-7-6-feedback-recovery-r2.png
Supersedes: story-7-6-feedback-recovery-r1.png (original retained).
Text contract: ../../planning-artifacts/story-7-6-review-2026-09-06.md
No upload-error prompt; disabled upload, removable preview; busy state has no bottom actions.
Real timeout exits bounded waiting before recovery. All example content is fictional.

## Prompt

Use case: precise-object-edit. Edit the supplied Story 7.6 three-phone Chinese high-fidelity review board. Preserve the three-phone layout, white/black/forest-green style, phone sizes, all of phone A and the existing feedback wording/screenshot. Make ONLY these simplifications in B and C and update outside annotations to match. Title outside "Story 7.6 | 反馈状态简化 R2". No added dialogs, quota, new feature, or extra explanatory copy inside phones.

Phone A unchanged: outside "A 外部页面打不开"; its existing external-failure actions remain exactly as before.

Phone B: outside heading becomes "B 截图上传不可用". Keep the text field, existing screenshot preview and its small X remove icon. REMOVE the amber "截图上传失败" line entirely. REMOVE the "重试上传" command entirely. REMOVE the green "移除截图，仅提交文字" button entirely. Instead show ONE quiet disabled image/upload icon + label "上传截图" in light grey below the preview. Keep no visible failure sentence/banner/toast. Bottom has the standard "提交反馈" button, light grey disabled while the selected screenshot is not uploaded. No special text-only submit button. The screenshot X remains a clear enabled remove action. Do not add any message explaining the disabled state inside the phone. Outside below B, two short annotation lines: "上传不可用只置灰，不额外提示" and "移除已选截图后，正常提交文字". Gray does not mean the attachment succeeded; don't show a success check.

Phone C: outside heading becomes "C 上传 / 提交中". Keep the spinner and submitted-text summary, but main status text now "正在提交反馈"; secondary text "内容已保留，请勿重复提交". REMOVE BOTH bottom buttons "重新查看" and "返回", completely, leaving natural whitespace. Do not replace with any other bottom button/link. Keep the small top-left navigation chevron as existing page navigation, not a new bottom CTA. No false success or progress percentage. This frame illustrates active upload/submit; ongoing receipt verification uses the same button-free layout with stage-correct text "正在确认提交结果". Do not display both status titles simultaneously. Outside below C: "进行中无底部按钮，自动核实同一申请". Actual bounded timeout/recovery is governed by the text contract, not an endless spinner.

Replace the old bottom board explanatory footer with one concise outside-only line: "截图不静默丢弃；正常进行中不显示恢复操作，真实超时后再进入恢复状态。"
Do not leave any old outside caption mentioning explicit text-only button or "原页面状态保持". Professional readable Chinese, no overlap, stable dimensions; preserve A exactly and all unaffected styling. Deliver one edited board, not separate images.
