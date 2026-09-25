# Story 6.5 Return Task Time Preview

Status: deferred exploration; checklist-to-schedule conversion was deferred by the user on 2026-09-06. Not an MVP implementation reference.
Tool: built-in ImageGen; all dates, times and route values are illustrative fixtures.

## Prompt

Create a high-fidelity Chinese travel-planning UX board with three complete portrait phones, white
background, restrained dark-green commands, black text, neutral dividers and small amber conflict
accents. Title outside phones: "Story 6.5 | 返程事项确认预留时间". Compact utilitarian phone UI,
familiar outline icons, no brand/version, no nested cards, every phone and home indicator visible.

A exterior label "A 清单里的返程事项". A record editor titled "车站取寄存行李". Compact rows
"日期  D3 · 7月16日", "地点  厦门站", "预计用时  20分钟" with editable values and appropriate icons.
Small field "相关交通  18:45 发车". Record state "尚未预留时间". Primary command "预留时间".
This is still a checklist record, not already on the timeline. Exterior caption "记录和安排分开，点击后预览".

B exterior label "B 预览并确认". Title "确认预留时间". Date D3 · 7月16日. Plain vertical sequence:
"16:45  中山路结束", a transit row "前往厦门站 · 约30分钟", highlighted proposed row
"17:15—17:35  取寄存行李", existing row "17:35—18:15  进站与候车", then "18:45  发车".
The proposed row has only a subtle green left marker and icon, not a floating card. Keep existing
transport/boarding blocks visibly separate. Bottom primary "确认预留", secondary "返回修改".
Exterior caption "确认后写入行程，可用全局撤销".

C exterior label "C 时间冲突". Same confirmation container. User proposed time
"18:00—18:20  取寄存行李". Show amber issue "与进站预留时间重叠" and an existing row
"17:35—18:15  进站与候车". Keep 18:45 发车 unchanged. Primary repair command "调整时间",
secondary "暂不加入". No enabled confirm-apply button for this hard conflict. Exterior caption
"保留清单记录，不挤占已确认交通". Do not invent a repair that shifts the train departure.

This is a product prototype, not a railway schedule or legal travel recommendation; all sample
values are fixture data. Do not show itinerary version numbers, technical errors, clock-snap tips,
stock facts, automatic reminders, quota UI or public place-verification badges. Text and buttons
must fit all phone surfaces. Use crisp Chinese, familiar luggage/train/clock icons, minimal real
station photo thumbnail only if it helps identify the place. No watermark or gradients.
