# story-7-2-check-in-recovery-identity-r1

Status: deferred-out-of-mvp (user-confirmed 2026-09-06); historical prompt, not implementation authority.
Tool: built-in image_gen.
Saved asset: story-7-2-check-in-recovery-identity-r1.png

## Prompt

Use case: ui-mockup. Create a companion four-phone high-fidelity Chinese mobile travel UX board titled outside "Story 7.2 | 保存状态与到访区分", white landscape canvas. Use supplied three-phone board for exact visual language: white, black text, forest-green confirmed check, thin grey separators, colorful place photos, compact one-column ResultSheet. No Nomad, v7, notification popup, bottom undo bar, GPS gate, chain-of-thought, expanded POI descriptions, or new check-in percentage.
Four outside panel titles: A "保存中"; B "保存失败"; C "替换了地点"; D "另一天再去".
All phones same existing ResultSheet header back, 行程单, 厦门 · 3天, date tabs D1 7/14 D2 7/15 D3 7/16. Compact overall check rows optional to keep comfortable vertical spacing. Ordinary timeline body click/chevron stays separate from right-side check control. Hotel footer has no check control.

A: D2 selected. Rows 09:00 日光岩, 11:30 菽庄花园, 14:00 中山路 with destination photos. 日光岩 right-side action is grey small spinner and label "保存中", NOT green checked success, disabled while saving. The other two right actions remain grey check-outline and 打卡. No other spinner or global blocking overlay. Annotation below outside: "只等待这一次标记，不阻塞查看行程".
B: same D2, all exact same rows. 日光岩 right check action remains unconfirmed grey outline 打卡; below this row a small muted red status "未保存" with retry-arrow icon and green text "重试". Rest of page still readable. This is a confirmed server rejection before commit, not an ambiguous network timeout. Annotation outside: "失败保留原状态；结果不明时先查询".
C: D2 selected. Replace prior 09:00 日光岩 with 09:00 厦门园林植物园 using botanical-garden thumbnail; title may wrap to two lines, not collide with controls. New place's right action grey outline 打卡, NOT 已打卡. Other rows 菽庄花园 and 中山路 unchanged. Annotation outside: "原日光岩已打卡；替换后的植物园不继承".
D: D3 selected. 09:00 日光岩 with right grey outline 打卡, 11:30 沙坡尾 with grey outline 打卡, a natural waterfront thumbnail. Footer "返程 · 18:45 厦门站" as noninteractive summary, no check-in. Annotation outside: "D2 已打卡，不代表 D3 也去过".
Use clear separate row hit areas, readable Chinese, no nested cards, no error-only decorative pictures. Show no strikethroughs on POI names. Footer board text outside: "建议规则：同日调时保留；换地点、移到另一日期或新建到访重新标记". This footer is proposed behavior for user review, not already implemented. Deliver one board.
