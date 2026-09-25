# story-8-3-route-recovery-rollback-r1

Status: approved with Story 8.3 (2026-09-08); synthetic, not deployed UI.
Tool: built-in image_gen.
Original: /mnt/c/Users/123/.codex/generated_images/01a019f0-508b-71a3-80eb-2bb7436d7fd1/exec-b7175fbb-73fb-4174-9189-c7fdbf11d9e2.png

A-D are separate examples, not one chronological run. A uses an incompatible image-task backup; B's pre-submit r13 is only last-known state, not confirmation of the active head after disconnection. C recreates old content as r14, with current capability/secret checks still required. D pauses future calls, including queued attempts, without promising to cancel in-flight requests or erase charges. Restore needs a separate explicit operation; it does not reset real breaker state.

This proposes a narrow Nomad operator surface on the existing stack, not a vendor screenshot or
a duplicate general admin platform. No deployment, model call or configured production connection
is evidenced. Actual schema/permissions/API/DB and browser behavior require later implementation.
Version-conflict, empty, no-permission, long route list and successful resume are defined by the
Story but not all shown here; they need real browser verification before implementation acceptance.

## Prompt

Use case: ui-mockup. One high-fidelity Chinese desktop operator UI state board, 1536x1024 landscape, four spacious software panes in a two-by-two grid. White background, compact black text, green command buttons, restrained red for check rejection, amber unknown, blue information. Flat utilitarian layout, <=6px corners, no gradients/cards inside cards/decorations/mobile phones. Outer title "Story 8.3｜失败恢复、回滚与暂停". Subtitle "运营操作提案 · 合成示例 · 非已部署界面".
Top left outer caption "A 检查未通过". Inside title "图文理解 · 生产草稿". Field "备用模型  连接 T / 文本模型". Red line with warning icon "备用模型不支持图片输入". Neutral short text "已发布配置保持不变". Dropdown action "更换备用模型". Bottom buttons outlined "返回修改", green "重新检查", a disabled "发布". No paid live call triggered automatically.
Top right caption "B 发布结果未知". Title "正在核实发布结果". Amber status "连接中断，结果尚未确认". Two metadata rows "操作 op-demo-42" "提交前版本 r13". Neutral line "草稿与操作记录已保留". Button with refresh icon "查询操作结果"; disabled neutral "再次发布". Avoid saying failed or active r13 is certain, no automatic duplicate submission.
Bottom left caption "C 回滚前确认". Title "回滚生产配置". Compact rows "任务  初始规划", "当前版本  r13", "恢复设置  r12", "将创建  r14". Description "仅影响后续新接收任务" and "不会修改已有行程或解除暂停". Buttons outlined "取消", green undo icon "确认回滚". Treat history as new release, not deleting versions. No slider.
Bottom right caption "D 暂停新调用". Title "暂停初始规划的新调用？". Clear concise impact "阻止尚未发出的请求、重试和备用调用" then "已发出的请求不保证撤回". Small neutral status line "不会重跑或撤销用户行程". Two clear buttons outlined "取消", amber pause icon "确认暂停". Do not claim instant global enforcement or stop billing. Outside footnote under pane "恢复需要独立确认；普通回滚不会解除暂停".
Bottom outer annotation "配置失联：保留可信旧版本；安全授权过期则停止新外发。所有恢复都查询真实操作状态，不盲目重发。". Each pane no more text than specified, ample margins, no overlap; drawn for conversation review not actual software screenshot.
