# Story 6.3 Area Food Context R2

Status: approved with Story 6.3; implementation must follow its GWT contract and fixture boundaries.
Tool: built-in ImageGen.
Reference: story-2-1-area-food-suggestions-r1.png, used only as a visual reference.

## Prompt

Create one high-fidelity Chinese mobile UX board for Story 6.3. Use the reference's compact
white mobile travel timeline, green accents, food/location thumbnails and familiar outline icons.
Four evenly spaced complete portrait phones on a clean white landscape board; keep all phone
bottoms, buttons and captions visible. Title outside the phones: "Story 6.3 | 商圈归属与附近吃什么".
No Nomad branding, version labels, marketing sections or decorative illustrations.

Panel A outside label: "A 商圈附加入口". Header "厦门 · 3天", back and history icons. Dates
D1 7/14, selected D2 7/15, D3 7/16. A compact continuous timeline: 09:00 日光岩,
12:30 午餐, 15:00 中山路步行街, 18:30 沙坡尾. Hotel footer "厦门海景酒店 · 含早餐".
Directly beneath 中山路步行街 show one small indented clickable row with utensils icon:
"附近吃什么 · 来自导入笔记 4家" and chevron. This row has NO time, timeline dot, checkmark,
selected state or new large card. Exterior caption: "挂在地点下方，不新增餐饮槽".

Panel B outside label: "B 我的导入美食". Same timeline dimmed behind an accessible bottom sheet.
Title "中山路附近吃什么", close icon. Small factual subtitle "中山路商圈 · 来自我的导入".
Four plain separated rows with food thumbnails and chevrons: 局口拌面, 黄则和花生汤,
阿吉仔, 宴遇·中华城店. Secondary details are food category and an address fragment, not live
distance. Each row has a subtle source link "来自笔记 2条" (or 1条/3条 as appropriate) with
a document icon. Tapping a restaurant opens the already designed generic POI sheet, tapping
the source link opens that owner's import records. No radio buttons, no checkboxes, no add-to-plan
button. Exterior caption: "点餐厅看地点，点来源看自己的笔记".

Panel C outside label: "C 无可靠归属". Same full timeline as A, including the 中山路步行街 POI
but absolutely NO food hint underneath. Keep the timeline spacing natural. Do not insert an error
or technical badge. Exterior orange annotation pointing to the space below that POI:
"没有可靠商圈或没有我的有效导入结果时，隐藏入口". This is outside the phone only.

Panel D outside label: "D 打开后结果变化". Same timeline with sheet titled "中山路附近吃什么".
Neutral small utensils icon, empty-state text "暂时没有可查看的美食", primary simple command
"返回行程". Exterior caption: "导入删除或归属失效后，清空旧结果". Under this exterior caption,
a small annotation "加载失败则保留重试，不当作没有结果". Do not add a notification permission flow.

Constraints: Match a real usable mobile travel tool, compact typography and stable spacing, no
nested cards. Preserve photo thumbnails. Green is a restrained action accent, with black text and
neutral borders. Chinese text must be legible. No 高德已核实/高德已验证 badge, freshness/quality
labels, numeric confidence, live location, map, fabricated queue information, reservation claim,
auto-added food node, duration promise, watermark or background decoration. All explanatory
annotations and panel labels belong outside the phones. Every row/icon has a comfortably sized
touch area and no overlap. All four screens fully fit within the canvas.
