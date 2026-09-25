# Story 7.1 Recent Trips Recovery R1

Status: approved-with-story-7.1 (2026-09-06); text/annotation governs; not implementation completion.
Tool: built-in image_gen.
Saved asset: story-7-1-recent-trips-recovery-r1.png

## Generation

Use case: ui-mockup. Create a SECOND complementary high-fidelity Chinese mobile UX review board for Story 7.1, four phones side-by-side on white landscape canvas, around 2048x1152 for legibility. Match supplied reference visual language: white iOS-like, deep green CTAs, dark text, subtle grey lines, natural colorful destination photos, no decorative gradients, no nested cards, restrained <=8px cards. Title outside: "Story 7.1 | 空态与恢复". Four screens, readable Chinese, 9:41. Explanatory captions only outside phone. Do NOT add Nomad, v7, BYOK, check-in, new itinerary lifecycle questions, fake progress bars, account personal data, giant error illustrations.

A outside title "还没有行程". Home header hamburger and 计划|灵感 with 计划 active. Section 最近行程. Compact empty state text "还没有行程" and small neutral calendar-outline icon. No fictional trip. Below 灵感目的地 with two existing owner inspiration rows 厦门, 杭州 with thumbnails. Bottom original single long composer with placeholder "粘贴分享链接或输入想去的地点，如：厦门 3天" and square green PLUS button; wrap placeholder if necessary. No separate 开始规划 CTA, no link icon, no tabs inside composer. The user can still input.
B outside title "列表加载失败". Screen back arrow, centered "最近行程". Near upper middle restrained small disconnected-cloud icon. Text "暂时无法加载行程"; icon+text action "重试". Plenty of plain white space, no fake empty-state claim, no fictional cached trip. Back arrow remains. This is API failure with NO cached rows; empty result is A and not used here.
C outside title "首次生成失败". Existing planning shell back arrow and "苏州 · 2天", history icon inactive, D1 10/3 and D2 10/4. The itinerary has NOT published: never invent POIs, photos, usable itinerary or partial schedule. A compact unframed status region below tabs, small muted red alert icon + "暂时未能生成行程". Small supporting text "输入已保留". Green icon+text button "重试生成" and secondary text "修改旅行信息". White remainder; no percentage, no technical job state codes, no Provider name. This example is a retriable exhausted temporary failure, not a quota/auth error.
D outside title "已有行程仍可用". Back arrow and centered 最近行程. Show one Xiamen trip photo row "厦门 · 3天", "7月14日–16日", "已生成", green "继续查看 ›". Immediately below this same row, small subordinate rust-red warning line "本次调整未生成" with "查看原因 ›". No duplicated second failed-trip card and do not change row's main status to 生成失败. Beneath it an ordinary "杭州 · 4天" row, "8月20日–23日", "草稿 · 住宿安排", "继续填写 ›". Do not display historical revision numbers.
Outside bottom captions aligned under each phone: A "无行程不阻塞输入"; B "加载失败不等于行程为空"; C "重试由用户触发，不重复创建任务"; D "已发布行程与修改草稿分开恢复". Thin connecting callout below D may say "查看原因后可返回调整草稿；当前行程保持可读". This board is an interaction proposal, not evidence of working software. Deliver one polished board.

The final selected output is exec-f4ee363b-5ea9-4fe8-8b96-ba9c009727b2.png. The first-generation retry example is a retriable transient failure, not a universal response to quota/auth/structural errors.
