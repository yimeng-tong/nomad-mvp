# story-8-3-route-config-release-r1

Status: approved with Story 8.3 (2026-09-08); synthetic, not deployed UI.
Tool: built-in image_gen.
Original: /mnt/c/Users/123/.codex/generated_images/01a019f0-508b-71a3-80eb-2bb7436d7fd1/exec-54de9a01-f6ed-4cbe-8345-5127de7d2e57.png

A/B/C follow the same proposed r12 -> r13 release. A's 20 seconds / 2 attempts are illustrative, not defaults. A r13 operation success does not imply all workers adopted it. C deliberately has no new r13 tasks; old queued/running tasks stay pinned to r12. Compatibility evidence in B is synthetic and distinct from a static check or live test.

This proposes a narrow Nomad operator surface on the existing stack, not a vendor screenshot or
a duplicate general admin platform. No deployment, model call or configured production connection
is evidenced. Actual schema/permissions/API/DB and browser behavior require later implementation.
Version-conflict, empty, no-permission, long route list and successful resume are defined by the
Story but not all shown here; they need real browser verification before implementation acceptance.

## Prompt

Use case: ui-mockup. Generate a polished Chinese desktop operations prototype board, wide 1536x1024, three side-by-side compact software views. White background, black text, restrained emerald commands, blue selection, amber only pending, 6px corners, flat tables and unframed form sections. No gradients, marketing hero, card nesting or mobile phones. Outer title "Story 8.3｜配置、发布与生效". Subtitle outside UI "轻量运营页提案 · 所有连接、版本和记录均为合成示例". These are proposed Nomad controls, NOT a faithful Langfuse/Unleash/gateway screenshot.
Panel A outer caption "A 路由与草稿". App header "模型路由" with small environment selector "生产". Status row "当前发布 r12" and a small history icon. Compact list table columns "任务 | 主用 | 备用": rows "初始规划 | 连接 A | 连接 B" selected pale blue, "细节完善 | 连接 C | 连接 A", "图文理解 | 连接 V | 连接 W". Below divider editable section "初始规划 · 未发布草稿"; dropdown fields "主用模型  连接 B / 模型 B", "备用顺序  1 连接 A / 模型 A", then compact numeric inputs "单次超时 20 秒" and "总尝试上限 2". Small link icon "评价记录 eval-18". Footer outline button save icon "保存草稿" and green check icon "检查配置". No API key or freeform base URL.
Panel B caption "B 发布前确认". Title "发布生产配置". Row "初始规划 · r12 → r13". Comparison table "改动 | 当前 | 新配置": "主用 | 连接 A | 连接 B"; "备用 | 连接 B | 连接 A". Below green check lines "结构检查通过" "连接兼容性已核验"; neutral link "查看评价 eval-18". Unframed impact section "生效范围" body "发布后新接收的任务使用 r13" and "已接收及排队任务继续使用 r12". Bottom clear controls "返回修改" outline and "确认发布" green. No extra publish workflow or quota panel.
Panel C caption "C 发布后的真实状态". Title "模型路由 · 生产". Green status "发布已确认 · r13". Small timestamp "09:42". Divider and amber clock "等待首次使用验证", neutral line "尚无新任务使用 r13". Table "任务 | 使用版本 | 状态": "job-41 | r12 | 执行中"; "job-42 | r12 | 排队中". Small history row "r12 → r13 · 已记录". Command row icon history "查看记录"; outlined undo icon "回滚配置". Separate small power/pause icon command "暂停新调用". No blanket '全部实例已生效' claim, no expected approval from incoming tasks.
Outside annotations under A "保存草稿不会改变线上调用"; under B "普通发布不重启已有任务"; under C "发布成功不等于已经验证新模型".
Footer annotation outside "8.2 做实验与人评；8.3 才控制生产调用。回滚配置不会回滚用户行程。". Keep all text crisp and unclipped, no fabricated health graphs. Model A/B/C/V/W are generic registered connections, not actual vendor claims; time/counts are examples not defaults.
