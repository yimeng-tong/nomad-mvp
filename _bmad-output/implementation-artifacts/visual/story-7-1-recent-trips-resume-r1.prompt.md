# Story 7.1 Recent Trips Resume R1

Status: approved-with-story-7.1 (2026-09-06); text/annotation governs; not implementation completion.
Tool: built-in image_gen.
Saved asset: story-7-1-recent-trips-resume-r1.png

## Initial Generation

Use case: ui-mockup.
Generate a high-fidelity Chinese mobile travel-planner UX review board, 3 phone screens side by side on a plain white wide canvas. Title outside phones: "Story 7.1 | 最近行程与继续使用". Use the input images ONLY as visual language references: first for Home shell, second for ResultSheet. Do not copy their old planning status text. Crisp readable simplified Chinese, professional iOS-like white surface, fine light grey separators, forest green commands, natural colorful destination photos, flat unframed sections, at most 8px row/card corner radius. No logos, Nomad badge, version number, giant marketing areas, gradient background, nested cards or overlapping labels. 9:41 status bar.
Outside caption A "首页继续"; B "最近行程"; C "回到上次查看位置". Exactly three phones.

A: hamburger at upper left, centered segmented control "计划 | 灵感" with 计划 active. Section "最近行程", right aligned text action "全部 ›". Moderately sized existing Xiamen waterfront photo trip card, bright recognizable Gulangyu view. Text "厦门 · 7月14日–16日", next line small "已生成 · 3天", action "继续查看". Below unframed "灵感目的地" list with two thumbnail rows 厦门 / 杭州 with small regional summaries. Bottom existing Home dock: one LONG input plus forest-green square + button. Input placeholder wraps legibly if needed "粘贴分享链接或输入想去的地点，如：厦门 3天". No link icon, input tabs, fake progress, recognition banner or import job on this empty input state.
B: back chevron, title "最近行程". One vertical list of FIVE distinct trips, each with a small square destination image, title/date, truthful small state and right-side action. Row1 "厦门 · 3天" / "7月14日–16日" / green "已生成" / "继续查看 ›". Row2 "厦门 → 泉州 → 福州" / "8月2日–7日 · 6天" / green "已生成" / "继续编辑 ›". Row3 "杭州 · 4天" / "8月20日–23日" / muted "草稿 · 住宿待填写" / "继续填写 ›". Row4 "成都 · 4天" / "9月10日–13日" / spinner + "规划中 · 正在校验" / "查看进度 ›". Row5 "苏州 · 2天" / "10月3日–4日" / muted rust-red alert + "生成失败" / "查看原因 ›". All titles fit, long city chain uses two lines. No completed-travel label, no check-in, filters, dates chosen automatically, archive, duplicate child-trip cards, or separate status detail cards.
C: reuse ResultSheet visual, title "行程单" with subtitle "厦门 · 3天". D1 7/14, green selected D2 7/15, D3 7/16. Compact unframed "整体核查" two rows: green check "时间安排" right "无硬冲突"; document icon "行程细节" right "3项待完善" and "去完善 ›". Below "D2 · 7月15日" ordinary compact waterfall POI rows 09:00 日光岩, 11:30 菽庄花园, 14:00 中山路 with photos and chevrons, no expanded descriptions or completion marks. Footer hotel "厦门海景酒店 · 今晚继续入住". Never show a new planning or details completion button under timeline.
Outside annotation under A: "打开行程，不重新生成". Under B: "一趟联程只占一项，草稿和任务各有恢复入口". Under C: "恢复日期与浏览位置；细节是否完善另行核查". Short annotations only outside phone, never treated as in-app instructions. Deliver one polished readable board.

## Targeted Correction

Edit this exact three-phone Story 7.1 board with ONE text correction only. In the MIDDLE phone, third row for 杭州, replace the grey subtitle 草稿 · 住宿待填写 with 草稿 · 住宿安排. Hotel input is optional; the label names the resumed screen, not a mandatory hotel task. Keep every other pixel/layout, other texts, typography, photos, dates, spacing, title, captions, Home dock and right ResultSheet unchanged. Do not add anything.

The final selected output is exec-7296178c-f088-4f02-a756-f94d585882f7.png. Exact UI copy follows the GWT review draft; hotel input remains optional.
