# Story 6.4 Record Workflow R1

Status: approved with Story 6.4; implementation follows its GWT contract.
Tool: built-in ImageGen.
Reference: story-2-1-shopping-add-record-r1.png (style and original composer).

## Prompt

Create one high-fidelity four-phone Chinese mobile UX board extending the reference's travel
checklist. White background, compact mobile typography, dark green command accents, neutral
borders, familiar outline icons, flat section layouts and realistic phone safe areas. No branding,
gradients, quality badges, giant cards or nested cards. All four phones must fit completely,
including bottom home indicators. Board title outside phones: "Story 6.4 | 添加记录与 AI 确认".

Panel A outside title: "A 直接添加". A mobile Sheet opened from 行程清单. Title "添加记录".
Multiline editable text "记得带充电宝". Below, compact menu rows: "分类  其他记录" and
"日期  整趟" with chevrons. Green bottom button "保存记录". Close icon in Sheet header.
This represents clicking 直接添加 in the existing composer, not saving an empty item.
Exterior caption: "保留原文，填写后保存".

Panel B outside title: "B AI 整理中". A Sheet titled "AI 提示". The user's original input appears
in a compact editable field: "出门前充电宝要检查些什么". Below show an honest loading indicator
and text "正在整理建议" with two small neutral skeleton text rows. No percent, no fake checklist
results, no saved success. Commands: "停止生成" and "直接添加原文". Exterior caption:
"点击 AI 后才生成，已有清单仍可用".

Panel C outside title: "C 确认 AI 建议". Same Sheet title "AI 提示". Original input preserved above.
Two proposed items with accessible checkboxes and small edit-pencil icons: "检查充电宝电量" and
"带上充电线". Each has small secondary metadata "其他记录 · 整趟". Both selected for this example.
Small count "已选 2 条". Bottom green button "加入选中 2 条", secondary text "返回修改".
Do not show success yet, no automatic write, no forced store/place association. Exterior caption:
"可编辑、可取消选择，确认后入清单".

Panel D outside title: "D 失败保留输入". Same Sheet with the exact same original input visible.
Small neutral error text "暂时无法生成建议". Two clear command buttons: "重试" and
"直接添加原文". Preserve text and current checklist underneath. No credit, quota, billing,
API key or provider explanation. Exterior caption: "生成失败仍可直接记录".

Keep the checklist background subtle and consistent across screens, with existing grouped text
items. Do not display a schedule undo countdown in these Sheets. Category 其他记录 supports general
notes that are neither shopping nor return tasks. No links to store search, no timeline change,
no automatic return buffer or reminder. All explanatory captions and panel titles belong outside
the phones. Within the app only show fields, record content, true status and commands. Icons should
look like a consistent familiar outline library. Ensure readable Chinese and no overflowing text.

## Follow-up Edit

Remove the inherited green outlined `撤销 8` button from the dimmed top-right header in each of
the four phones. Replace only those regions with the same neutral dimmed background, preserving
all Sheets, fields, content, dates, checklist icon, captions and layout. Do not add another button.
