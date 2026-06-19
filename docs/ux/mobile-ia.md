# nomad-mvp Mobile IA & Wireframes (v0.1 → v0.2/v0.3-light inline)

Date: 2025-10-26
Owner: UX

## 0. Design Principles & Tone
- Awe/Wanderlust: ignite the desire to go; large imagery, natural light, breathing space.
- Companion, not Guru: gentle, specific, low-pressure guidance; avoid info overload.
- Trust & Doable: clear timeline, commute hints, undo everywhere; confidence in execution.
- Frame for Freedom: structure (2h slots, reachability circle) + freedom (free activities, drag/adjust).
- Here & Now: fast, restrained micro-interactions; map & cards stay in sync.

Motion: 120–200ms; Sheet snap 240–300ms; Marker activate 150–180ms; timeline insert 200ms + subtle haptic.
Touch target: ≥ 44×44pt. Dynamic type: text scales without layout breakage.

## 1. Navigation Model (Global)
- TopSwitch (sticky): 旅行规划 | 灵感库
- Drawer (left, ☰):
  - 主区： 首页 / 灵感库 / 设置
  - 分隔
  - 历史规划：已完成/ 未完成
    - 列表项：显示 “{城市} · {起始日期} · {天数}天” 与最近更新时间；点击进入对应 plan（保留状态）
    - 过滤/搜索（可选，MVP 可省略）
  - 分隔
  - 帮助与反馈 / 关于
- UnifiedInput (bottom, sticky): 粘贴小红书链接，或输入：杭州 11/2 起 3天
- Tabs in planner: D1 | D2 | … | Dn (memorize each day scroll)

Header Usage
- 首页/灵感库：hamburger button + TopSwitch（计划|灵感）；
- 规划流程页（Planner Picker / 天级骨架 / AI 填充 / 行程单）：HeaderBar（返回箭头 + 标题城市/日期 + More + ProgressBreadcrumb）

### IA Tree (High Level)
- 登录首屏
- 首页
  - 目的地卡片（横滑）
  - 统一输入（粘贴/自然语言）
- 灵感库
  - 城市 Chips
  - 列表：今日新增 / 已入库 / 待定位（点整行→定位弹窗）
  - 地图联动模式（Map-to-Action Bridge）
- 灵感选择页（Planner Picker）
- 天级骨架（2h 槽位）
  - 空槽大弹窗：候选抽屉 | AI 建议 | 自由活动
  - 顶部可行性校验与一键修复
  - 长按：替换/移动D±1/调时/删除（撤销）
- AI 填充（一键生成→预览→应用全部）
- 导出（PNG 卡片）
- 设置（AI 用量、账号删除、数据导出、单位/时间制/动效开关）

## 2. Global Components & Patterns
- TopSwitch: sticky segmented control.
- HeaderBar: 顶部通用导航栏
  - 左侧：有前进后退关系的页面以“返回箭头”替代菜单（Planner Picker / 天级骨架 / AI 填充）；首页与灵感库保留菜单
  - 标题：规划流程页显示“{城市} · {出行日期}”，非规划页显示页面名
  - 右侧：More（…）轻按钮 → 菜单：导出 / 分享 / 帮助
- ProgressBreadcrumb（极轻量）：标题右侧点/徽章：灵感✔︎ / 骨架✔︎ / AI填充✔︎ / 行程单•；可点回到上一阶段（保留状态）
- UnifiedInput: link/intent detection; shows disambiguation panel when unknown
  - 位置：底部吸底；视觉不“细扁”，接近常见 AI 对话框尺寸
  - 多行自适应：最大高度 3–5 行（超出滚动）
  - 发送：右侧发送按钮；回车行为可在设置中切换“发送/换行”
  - 提交：Loading/禁用态避免重复提交
  - 粘贴识别：检测 XHS 分享口令/链接 → 轻提示“识别为小红书链接”
- Drawer: 侧边栏（hamburger 打开）
  - 分组与项：同 1. Navigation Model 所述
  - 历史规划项点击：
    - 已完成 → 以只读模式打开（允许导出/分享/编辑）
    - 未完成 → 继续编辑（跳转到上次离开页签/滚动位置）
  - 空态：暂无历史规划 → 提示“开始一次新的规划吧”

Telemetry（Drawer）
- drawer_open, drawer_close, drawer_nav_click(page)
- drawer_plan_open(plan_id, status=done|draft)

- CityCard: name + "XX 个想去"; CTA: 开始规划 / 查看灵感。
- PlanTimelineMobile: vertical day view, default 2h slots; blocks with duration; empty-slot placeholder.
- FixSheet: feasibility results + one-tap fixes (换时/近邻/挪日)。
- LocationModal: search (模糊+拼音/简称) + Top-5 (名称+地址) no confidence score.
- SlotSuggesterList: time-window fit > distance > vibe > popularity; shows "为何推荐" ≤16 chars；来源 Chip：“来自 用户候选/AnchorPool”；可显示“靠近酒店/回程方便”等 near_hotel 解释（不显示距离/评分/置信度）。
- AITipsList: lightweight activities (步行线/拍照点/小吃等)。
- Buttons/CTAs: primary bottom CTA per screen; consistent copy.

Accessibility: color contrast ≥ WCAG AA; large tap targets; focus order logical.

## 3. Screen Wireframes (Textual)

### 3.1 登录首屏
Purpose: secure entry; pass review.
Layout:
- Brand minimal, privacy/terms links visible on first screen (可跳转查看)
- 登录方式（iOS 中国区）：Apple｜手机号｜微信，并列同层等权、同尺寸；排序：Apple｜手机号｜微信
- 行为验证：默认不打断；命中风控（IP/号段/设备指纹异常）或短信失败重试时触发；高峰期可临时切到“发送前必过”（远程开关）
States:
- OTP sent / resend / error / cooldown
- Failure → surface help

### 3.2 首页
Purpose: spark action with minimal elements.
Layout:
- Header: hamburger button+TopSwitch（计划|灵感）
- 最近行程入口：在内容顶部以卡片形式展示“继续上次行程：{城市} · {起始日期} · {天数}天”，根据计划状态展示 CTA：“继续编辑/查看行程单”。
- Content: 目的地卡片横滑（城市名 + 次文案“XX 个想去”）
- Footer: UnifiedInput（粘贴/自然语言；多行 3–5 行；发送按钮；回车行为可切换；提交 Loading/禁用；粘贴 XHS 轻提示）
CTAs:
- 开始规划: prefill input with city, focus for date/days; no picker
- 查看灵感: switch to 灵感库 filtered by city
Copy:
- 不额外“找到N条灵感”提示条；融合在卡片次文案

### 3.3 灵感库（列表 + 地图联动）
Purpose: browse/manage inspiration; locate; pick.
Layout:
- Header: hamburger button+TopSwitch（计划|灵感）
Modes:
- List (Sheet-High≈清单) ↔ Split(≈55%) ↔ Map-Full（抽屉吸附位）
List:
- City chips; sections: 今日新增 / 已入库 / 待定位
- 待定位：点整行 → 定位弹窗（搜索 + Top5 名称/地址 → 确认即入库）；不阻塞浏览
Map-to-Action Bridge:
- Map (top 32–40% default; lazy load; cluster)
- CardSheet (bottom; keeps bottom action bar visible in all snaps)
- 详情展示统一使用全高 Bottom Sheet，不跳路由
Sync:
- Card→Map: visible cards highlight marker; tap card → flyTo 300ms
- Map→Card: tap marker → scroll & "lift" card (shadow)
Action strategy:
- 有骨架：主CTA=加入 D{n}·{上午/下午/晚间}（可改）
- 无骨架：主CTA=加入候选；底条“已选 N / 生成骨架”

### 3.4 灵感选择页（Planner Picker）（上下文灵感选择页）
Purpose: 在规划上下文内挑选本次要用的 UGC 素材，作为“部分填充/锚点输入”。不属于“灵感库”导航项，但复用其卡片/定位能力。

Header
- 使用 HeaderBar：左“返回”、标题“{城市} · {出行日期?占位} · {天数?占位}”、右“More”；标题右侧 ProgressBreadcrumb（灵感• / 骨架 / AI填充）

Entrances & Route
- 仅以下两条路径可进入本页；本页不出现在“灵感库”导航，其他页面不允许直接跳转。
- 入口 A（主）：首页底部输入解析 trip_params 成功 → 进入本页
- 入口 B（补充）：首页目的地卡“开始规划” → 进入本页
- 路由：/planner/pick?city={CITY}&start={YYYY-MM-DD?}&days={N?}&source={home_input|home_card}&rec_id={CARD_ID?}

Layout（Map-to-Action Bridge）
- Top：MapPane 默认 32–40% 屏高；向上拖进入 Split（≈55%）/Map-Full（≈100%）
- Bottom：CardSheet 三段吸附：Sheet-High → Split → Map-Full；任一吸附位均保留底部操作条（已选 N | 下一步）
- 详情：统一全高 Bottom Sheet（不跳路由）

Linking Rules
- 卡片→地图：列表滚动时可见卡片的 Marker 高亮；点卡片→地图飞到该点（300ms）
- 地图→卡片：点 Marker→滚动该卡片并“抬升”（阴影/缩进）
- 选择一致性：卡片与地图点的“加入/已加入”实时同步

Overlays（可开关）
- UGC POI 层（与搜索结果颜色区分）
- 可达圈：步行 10/20/30 分（约 80m/分钟），标注“约 10/20/30 分”
- 热门拍照点热度圈
- MVP 不上 Lasso；改用半径三档 + 类目筛选 Chips

Gestures & Priority
- 下滑 CardSheet：先到 Split，再到 Map-Full；Map-Full 上滑回 Split
- 地图平移优先；抽屉顶部预留 24px 抓手区

Performance
- 地图懒加载：首屏停留 >300ms 或进入 Split 再加载
- Marker 聚合；列表虚拟化；图片 LQIP + 渐进清晰；统一骨架屏
- 弱网/无地图：自动降级 Sheet-High 清单视图，地图区灰块提示“网络不佳，稍后自动重试”
 - 降级 CTA：提供“仅列表继续”按钮（保持列表操作可用），网络恢复后提示“可切换至地图模式”。

Wireframe — Planner Picker 弱网降级（仅列表继续）
```
[Map 区域降级占位]
┌──────────────────────────────┐
│ 网络不佳，稍后自动重试       │
│ [ 仅列表继续 ]               │
└──────────────────────────────┘

[CardSheet · 列表正常可用]
┌ 卡片 ▸ 加入候选 / 已加入 · 撤销 ┐
│ ...（支持选择、已选篮、下一步） │
└────────────────────────────────┘
注：点击“仅列表继续”隐藏地图区占位，保留列表与底部操作条；网络恢复后顶部轻提示“地图可用，切换至地图模式”。
```

Cards & Selection
- 卡片：4:5 封面 + 标题 + 标签 + 次信息；右下固定主 CTA
- 主 CTA：加入候选 → 已加入（显示“已加入 · 撤销”）；低置信显示“去定位”入口，复用定位弹窗

Basket & Footer
- 已选篮（吸底左）：“已选 N”（可展开面板：移除、must_go、time_hint、stay_minutes_hint）
- 主按钮（吸底右）：“下一步/生成骨架”；无“用热门生成骨架”动作（已删除）
- 缺参补齐：点主按钮时若缺 start/days → 弹参数 Sheet 补齐后生成

Generate（接口语义）
- POST /plan/generate：selected_items 作为锚点输入生成“部分填充”骨架（must_go/time_hint 优先落位；近邻聚类仅做部分填充）
- 未落位条目：不在骨架主视图直接展示，而是在“空槽→大弹窗”的“候选抽屉”中展示；若 Planner Picker 的 POI 已用完则提示“已用完”

Empty States
- 无灵感：展示“热门 UGC/AI 建议”棚格；CTA 仍为加入候选/行程
- 手势可发现性：抽屉顶部抓手 + “向上查看地图”细文案；首次进入给一次轻引导动画

### 3.5 天级骨架（2h 槽位）
Purpose: structure day; manual adjust only.
Header
- 使用 HeaderBar：左“返回”、标题“{城市} · {出行日期}”、右“More”；标题右侧 ProgressBreadcrumb（灵感✔︎ / 骨架• / AI填充）
Layout:
- Tabs D1..Dn; vertical timeline; empty-slot placeholder "空闲 · 2h"
- Bottom primary: 下一步：进入 AI 填充（仅当所有天已确认）
Seed:
- `origin=ai_seed` 块显示紧凑徽标“AI 预排”（标题右侧，按压态降噪）；生成完成后一次性顶部提示：“已为你预排 N 个（均可修改）”（6s 自动隐藏，可手动关闭）。
Interactions:
- 空槽 → 大弹窗（搜索|候选抽屉|AI建议|自由活动）
  - 候选抽屉：展示来自 灵感选择页（Planner Picker） 尚未用完的 POI；若已用完则提示“已用完”；按时窗/距离/vibe 重排
  - AI 建议：依据模型能力进行推荐（不改变时间与顺序，仅作为候选）
  - 自由活动：提供选项 购物｜city walk｜喝茶休息｜保持空白；“自由活动”表示该槽位不在后续流程自动填充
  - 搜索（FR44‑lite）：顶部文本搜索（AMap），Top‑5 列表（无地图）；结果项：加入候选｜直接落位（遵循硬约束）；失败提示“搜索暂不可用，请稍后重试”
- 候选卡：名称/通勤/时窗匹配 → 进入“时间调整”
- 时间调整：拖拽起止；允许跨槽；拖拽吸附 30/60 分钟刻度；冲突→轻量修复条（换到 14:00 | 缩短 15m | 换近邻）
- 长按块：替换/移动到D±1/调时/删除；撤销（8s Toast）+ 当日时间轴“最近操作”入口（可再撤一条）
Undo/Reset:
- 全局撤销 Toast 5–8s（默认 6s，单例刷新计时）；More(…) 菜单提供“一键重置预布局”（仅还原 `origin=ai_seed` 相关变更；保留手动编辑历史）。
Fix:
- 顶部可行性校验；提供一键修复；目标=0冲突或≤1且可修
- 冲突分级：硬冲突（无坐标/闭店/跨日不可达）→ 禁用“进入 AI 填充”，需先修复；软冲突（略超时/通勤略远等）→ 允许进入 AI 填充，顶部保留提醒与一键修复

FixSheet 示例数据（对齐 OpenAPI，参见 `docs/api/openapi.yaml`）
```
// ValidatorConflict example（too_far，含两条 FixSuggestion）
{
  "type": "too_far",
  "severity": "soft",
  "day": 2,
  "slot_id": "s_abc",
  "details": { "commute_minutes": 28, "limit_minutes": 18 },
  "suggestions": [
    {
      "id": "fix_1",
      "conflict_type": "too_far",
      "safe": true,
      "requires_user_input": false,
      "score": 0.87,
      "actions": [ { "type": "reorder", "notes": "交换前一槽以降低通勤" } ],
      "apply_sequence": [
        { "op": "move", "slot_id": "s_abc", "new_day": 2, "new_start": "14:00", "new_end": "16:00" },
        { "op": "move", "slot_id": "s_prev", "new_day": 2, "new_start": "16:00", "new_end": "18:00" }
      ]
    },
    {
      "id": "fix_2",
      "conflict_type": "too_far",
      "safe": true,
      "requires_user_input": true,
      "score": 0.81,
      "actions": [ { "type": "replace_with_alternative", "notes": "使用更近的替代项" } ],
      "apply_sequence": [ { "op": "replace", "slot_id": "s_abc", "replace_with_poi_id": "poi_nearby_1" } ]
    }
  ]
}

// FixSuggestion example（最小闭环）
{
  "id": "fix_1",
  "conflict_type": "too_far",
  "safe": true,
  "requires_user_input": false,
  "score": 0.87,
  "actions": [ { "type": "reorder", "notes": "交换前一槽以降低通勤" } ],
  "apply_sequence": [ { "op": "move", "slot_id": "s_abc", "new_day": 2, "new_start": "14:00", "new_end": "16:00" } ]
}
```

Hotel 单候选自动写入（FR41）
- 当某日仅存在 1 个酒店候选时，生成骨架后自动写入至当日末尾 hotel_slot，并显示轻 Toast：“已为你选定当晚酒店 · 撤销”。
- 撤销在 6s 内可用；撤销后恢复为空白状态。
- 说明：MVP 不触发任何自动重排；仅当用户主动更换/首次选择酒店时才提示是否重排（仅晚段/整日/取消）。

Wireframe — Hotel Autoset Toast & Undo
```
[Timeline DayN 末尾]
┌──────────────────────────────┐
│ 住宿 · {酒店名称}（展示）      │
└──────────────────────────────┘

底部轻 Toast（6s 自动消失，可手动关闭）：
┌─────────────────────────────────────────────┐
│ 已为你选定当晚酒店 · 撤销                   │
└─────────────────────────────────────────────┘

点击“撤销”后：恢复为空白 hotel_slot；提示“已撤销”。
```

### 3.6 AI 填充（一键）
Definition:
- 编排目标：仅“剩余、可控、非自由活动块”
- 说明补齐：为“所有块”补齐「做什么/准备/注意」
Header
- 使用 HeaderBar：左“返回”、标题“{城市} · {出行日期}”、右“More”；标题右侧 ProgressBreadcrumb（灵感✔︎ / 骨架✔︎ / AI填充•）
Norms:
- 做什么（必填）：≤ 3 行，单行 ≤ 30 字
- 准备（可选）：≤ 3 行，单行 ≤ 30 字
- 注意（可选）：≤ 3 行，单行 ≤ 30 字
- 列表超长折叠；详情可展开；后端对超长硬裁并加省略号
- 缺少“做什么”→ 直接报错并回退
Layout:
- Tabs D1..Dn；只读预览（按天分组）
- CTA: 应用全部 → 写回 notes/attachments；不改时间/顺序
Failure/Degrade:
- 失败/配额不足：保持骨架；提示稍后/分天生成
- 缺必需信息：跳回对应块补最小字段（如坐标）

Citings & Why（事实引用与简因说明）
- 每个槽位在「做什么/准备/注意」下方显示 why_short（≤16 字）作为轻量原因标签；点击打开来源短链（来源类型：AMap/官方/UGC 等）。
- 引用呈现：在 why_short 右侧显示来源短链（例如 a.map/xxxx），点击以系统 WebView 打开；站点禁止内嵌时回退系统浏览器（参考设置页面的 WebView 规则）。
- 缺少来源处理：当「做什么」无法关联事实来源时，保留文案并在行尾以浅色徽标显示「注意事实核查」。
- 可访问性：why_short 与来源短链具备可聚焦与朗读描述（"原因：…，来源：…"）。
- 埋点：ai_fill_citation_open(source), ai_fill_citation_missing(slot_id)。

### 3.7 行程单（ResultSheet）
- Purpose: read-only summary with light edits; export hub.
- Layout:
  - 按天分组只读视图；每槽位显示「做什么/准备/注意」。
  - 槽位轻编辑：≤3×30 字/段；按钮“恢复 AI 内容（单槽重置）”。
  - 顶部轻条：导出前显示可行性修复建议摘要。

Header（导出与平台 AI 额度）
- 导出区域右侧显示「平台额度：正常/偏低/排队/降级」；当额度偏低显示软提醒；当额度不足时显示可稍后继续或低成本生成说明。
- 点击额度条跳转设置页 AI 用量区域；返回时刷新计数与降级状态。
- 文案：
  - 额度偏低：“平台额度不多，建议先导出关键行程。”
  - 额度不足：“平台额度暂时不足，可稍后重试或使用低成本生成。”
- 埋点：resultsheet_open, resultsheet_export_click, ai_quota_warning_show, ai_quota_retry_click。

Wireframe — ResultSheet Header（Quota+Export）
```
[HeaderBar]
┌───────────────────────────────────────────────────────────────┐
│ ← {城市 · {出行日期}}             导出 PNG   免费导出：N ▢ │
│                                                （≤3 显黄点）│
└───────────────────────────────────────────────────────────────┘

AI 额度提示条（当额度不足或降级时显示，位于 Header 下方）
┌───────────────────────────────────────────────────────────────┐
│ 平台额度暂时不足，可稍后重试或使用低成本生成。 [ 查看 ]   │
└───────────────────────────────────────────────────────────────┘
注：导出按钮仍可点击；若触发降级，先展示提示条；“查看”跳设置页 AI 用量段。
```

Slot 状态（打卡）
- 交互：右侧提供「打卡 <> 已打卡」二态切换（胶囊/按钮），点击立即切换；无网络时排队并提示“稍后同步”。
- 接口：PATCH /plan/slots/{slot}/status；属性：status_checked: boolean。
- 显示：已打卡状态在时间线与结果页均显示对勾标识；可在结果页切换。
- 埋点：slot_check_toggle(slot_id, to=checked|unchecked, page=resultsheet|timeline)。
- Export:
  - 本页提供导出 PNG 入口；到达本页视为“已完成”。

Save/Restore Edge & Errors（轻编辑）
- 保存成功：底部轻 Toast “已保存”。
- 保存失败：提示“保存失败，稍后重试”；保留本地草稿并在网络恢复时自动重试一次。
- 恢复 AI 内容：执行后提示“已恢复为 AI 生成内容”；失败时弹提示并允许重试。
- 离线：编辑进入排队，显示“离线草稿 · 将在联网后同步”。

### 3.8 导出
- 长图形式：固定宽度 1080 px（可选 1242 px），纵向不设上限；行程过长按天切片多张
- 格式：优先 WebP；不兼容时降级 JPEG（75–80%）
- 体积目标：尽量 ≤ 600 KB（清晰可读优先）
- 导出接口：/export/png 支持 width_px、slice_by_day；预览提示“行程较长，已分为多张”

### 3.9 设置
- 总体：分组为 账号与登录 / 规划偏好 / AI 用量 / 数据与隐私 / 诊断与缓存

A. 账号与登录（MVP）
- 我的账号：头像、昵称、手机号
- 退出登录：放本页底部，二次确认
- 后端（占位接口）：GET /me、POST /auth/bind/*、POST /auth/unbind/*、GET /sessions、DELETE /sessions/:id

B. 规划偏好（MVP）
- 默认节奏：慢速 / 正常（默认）/ 稍快
- 默认起始时间：09:00（可改）
- 时间微调步进：15 分钟（默认）

C. AI 用量（MVP）
- AI 调用来源：平台额度（默认，服务端统一管理 Provider secrets）
- 平台额度状态：正常/偏低/排队/降级；展示今日生成、导出与并发状态
- 降级说明：低成本生成、稍后继续、无 AI 兜底文案
- Post-MVP：BYOK 可作为高级/内部能力保留，但不在 MVP 主路径展示

D. 可访问性与减少动效（全局）
- 系统“减少动态效果”开启时：
  - 地图飞行动画降级为瞬时定位（无平移动画）。
  - 抽屉吸附过渡时长减半且无弹性曲线；时间线插入/拖拽过渡弱化。
  - 微动效统一使用淡入/淡出；避免复杂缩放/弹跳。
  - 动画持续时间上限 180ms，首屏 LCP 相关动画延后执行。
- TalkBack/VoiceOver：确保 TopSwitch、why_short 与来源短链、打卡切换、撤销按钮可聚焦与朗读。

G. 数据与隐私（MVP）
- 删除账号与全部数据：二次确认 + 3 秒延迟按钮
- 第三方与权限说明：Authing / 高德 / 腾讯云 COS / 友盟（链接到文档或“关于”）

H. 诊断与缓存（MVP）
- 清理缓存：本地图片/临时文件
- 问题报告：上报日志快照（Sentry event id）+ 追加说明文本

## 4. Entry & Clipboard Flows
- Deep link / clipboard carries XHS text/password → 登录后继续原动作
- Disambiguation: 无法判定 → 底部半高 Sheet 提示二选一（不遮挡目的地卡/地图抓手）
- Multi-link paste: 自动截取第一条入队并 Toast：“其余请逐条粘贴”（含“更换”入口可改选）
- 灵感选择页（Planner Picker） 入口：
  - 仅以下两条路径；其余路径一律不进入本页
  - 底部输入解析 type=trip_params → /planner/pick
  - 目的地卡“开始规划” → /planner/pick（传 city 与可选 place_hints；start/days 生成前补齐）
- 粘贴识别：若检测到 XHS 分享口令/链接，显示轻提示“识别为小红书链接”
- 提交禁用：提交过程按钮 Loading/禁用以防重复提交
- Clipboard failure: fallback copy; teach "长按粘贴"
- U-Link attribution: channel/click_id → first_open/register → bind user_id

## 5. Microcopy (Key)
- 统一输入占位："粘贴小红书分享链接，或输入：杭州 11/2 起 3天"
- 粘贴识别："识别为小红书链接"
- 灵感选择页说明："勾选想去的地方；也可直接跳过生成"
- 时轴空槽："空闲 · 2h"
- 添加成功："已添加 · 撤销"
- 冲突提醒："与 14:00 的安排重叠 · 试试 15:00 或缩短 30 分钟"
- CTA 说明："当所有天的骨架确定后，再进行智能填充"
- AI 顶部："一次性编排剩余可控非自由活动块，并为每个块补齐做法/准备/注意"
- 应用完成："已应用到行程，可在时间线查看详情"
 - 行程单："行程单 · 只读预览（可轻编辑）" / "导出前请检查可行性与修复建议"
 - 槽位轻编辑占位："在此补充你的做法/准备/注意（≤30字/行，最多3行）"
 - 槽位恢复 AI：按钮“恢复 AI 内容”；确认“确定将此槽位恢复为 AI 生成内容？”
 - FR44‑lite 搜索占位："搜索地点或类别（Top‑5）"；失败：“搜索暂不可用，请稍后重试”

补充：
- 结果页打卡："打卡" / "已打卡"
- 最近行程入口："继续上次行程"
- AI 额度不足："平台额度暂时不足，可稍后重试或使用低成本生成。"
- AI 额度偏低："平台额度不多，建议先导出关键行程。"
- 事实核查："注意事实核查"
- 引用来源占位："来源：AMap/官方/UGC"

## 6. Compliance & Risk Guards (UX-Scope)
- First-screen links: Privacy/ToS accessible; plain language.
- Permission prompts: purpose-first phrasing; lazy ask (on user action).
- SMS safety: behavior verification on risk; rate limiting; IP throttle; number blacklist.
- Map attribution: AMap logo/copyright placement.

## 7. Telemetry Blueprint (UX-facing)
- Funnel: login → ingest → select → skeleton → ai_fill_apply → resultsheet → export
- Event naming (draft):
  - app_open, login_success, ingest_start/success/fail, library_select, skeleton_generate, slot_add, fix_apply, ai_fill_apply_all, resultsheet_open, resultsheet_export_click, slot_edit_apply, slot_edit_reset_ai, search_open, search_submit, search_result_click, export_png
- Properties (draft): city, day_idx, slot_idx, poi_id, source(xhs/nl), candidate_reason, conflict_type, fix_type

补充事件（MVP）
- slot_check_toggle(slot_id, to=checked|unchecked, page)
- ai_fill_citation_open(source)
- ai_fill_citation_missing(slot_id)
- ai_quota_warning_show / ai_quota_retry_click / ai_quota_degrade_accept
- recent_plan_open(plan_id, status=done|draft)

## 8. Open Questions
- Monorepo packages & shared UI lib naming?
- Sheet snap thresholds per device class.
- Hero slot rules per city/season; ops override UI.

## 9. Simple Flow (Mermaid)
```mermaid
flowchart LR
  A[App Open] --> B{Logged In?}
  B -- No --> L[Login]
  B -- Yes --> H[Home]
  H -->|InputSubmit / parseQuery| P[PICKER]
  H -->|XHS Link| I[Ingest Async + SSE]
  P -->|Next / POST /plan/generate| T[Generate Skeleton]
  T --> E[Edit Timeline]
  E -->|Validate| V{Hard Conflicts?}
  V -- Yes --> E
  V -- No --> F[AI Fill Preview]
  F -->|Apply All| X[Export PNG]
```

## 10. PRD ↔ UX Coverage Mapping (v0.1)
- FR1 登录与合规 → 3.1 登录首屏 + 6. Compliance & Risk
- FR2 首页分段/目的地卡/统一输入 → 1. Navigation Model + 3.2 首页 + 2. Global Components (TopSwitch/CityCard/UnifiedInput)
- FR3 统一输入分流（链接优先/NL 备选/无法判定二选一） → 2. Global: UnifiedInput 分流 + 4. Entry & Clipboard Flows
- FR4 XHS 入库异步 + COS 二次存储 + SSE 进度 → 10.1 入库进度 UI（新增）
- FR5 灵感库城市聚合 + 待定位 Top-5 → 3.3 灵感库 + LocationModal
- FR6 灵感选择页（可选） → 3.4 灵感选择页
- FR7 生成天级骨架 + 空槽大弹窗（候选/AI/自由） → 3.5 天级骨架 + SlotSuggesterList + AITipsList
- FR8 时间轴编辑（替换/移动D±1/调时/删除/撤销） → 3.5 天级骨架 Interactions
- FR9 可行性校验 + 一键修复 → FixSheet + 3.5 Fix
- FR10 AI 一次性填充（不改时间/顺序，补齐三要点） → 3.6 AI 填充
- FR11 导出 PNG → 3.7 导出
- FR12 设置（AI 用量/删除/导出） → 3.8 设置（A/B/C/G/H 分组）
- FR13 观测与评测（Langfuse/promptfoo/Sentry） → 7. Telemetry Blueprint（UX 侧埋点草案）
- FR14 第三方集成（登录/地图/COS 等） → 6. Compliance & Risk（可见性与文案）
- NFR1 国内可用/降级策略 → 文案与状态兜底（见 10.3）
- NFR2 前后端以 SSE 展示进度 → 10.1 入库进度 UI
- NFR3 AI 安全与成本控制（服务端 secrets/脱敏/签名 URL/额度降级） → 3.8 设置（呈现与说明）
- NFR4 性能目标（交互时延） → 0. Design Principles & Motion
- NFR6 可观测性漏斗 → 7. Telemetry Blueprint
- NFR8 动效/单列/分段吸顶 → 0/1/3 对应

### Gaps/Notes
- 地图-卡片联动的性能与分段吸附位阈值需按机型调参（见 Open Questions）。
- 导出 PNG 卡片规格需与工程对齐尺寸与字重（后续补规格图）。
- 登录首屏第三方与 Apple 等权：按平台差异出入口布局需评审。

### 10.1 入库进度 UI（SSE）
States
- created: 任务已创建
- fetching: 拉取
- parsing: 解析
- geo: 定位
- storing: 存储
- done: 完成（可进入灵感库）

UI
- 标签显示：获取/解析/定位/完成（可将 created/fetching 合并为“获取”；storing 归入完成前态）
- 展示规则：只显示阶段状态 + 个数，不显示百分比

### 10.1b 骨架生成 SSE（v0.2）
Phases（后端）：started → freeze → must_go → quota → candidates → place → validate → persist → done

呈现（两种其一，按开关实验）：
1) Header 轻量面包屑（默认）：紧凑胶囊依次点亮（skeleton_sse_ui=breadcrumb）；
2) 轻量 Toast（实验）：仅提示 started / place / done 三个关键节点（不叠加）（skeleton_sse_ui=toast）。

文案：
- 正在生成骨架… / 已冻结指定时段 / 必去优先落位 / 已计算预排额度 / 候选已就绪 / 正在预排推荐点 / 正在校验可行性 / 保存中 / 骨架生成完成

Retry & Copy
- 自动重试：指数退避，最多 3 次（次数/结果进埋点）
- 文案：
  - 重试中：“网络波动，正在为你自动重连…”
  - 超阈失败：“解析失败 · 轻点重试”

弱网表现
- 面包屑模式：未收到事件 >10s 显示“网络波动 · 正在重连”，并保持已完成阶段点亮不回退。
- Toast 模式：关键节点 Toast 合并不叠加；显示“正在重连…” 单条提示，成功后显示“已恢复”。

Empty/Errors
- 多行粘贴 → 顶部气泡提示：“一次仅处理一条链接”
- 网络波动 → 暂停态 + 重连倒计时；保留已完成阶段
- 内容安全触发 → 行内提示“已过滤敏感内容”，不阻塞后续

Wireframe — Skeleton SSE 面包屑（默认）
```
[HeaderBar]
┌──────────────────────────────────────────────┐
│ ← {城市 · {出行日期}}            …          │
└──────────────────────────────────────────────┘

[SSE Breadcrumb]
获取  ▸  解析  ▸  定位  ▸  完成
■□□□  （点亮顺序：获取→解析→定位→完成；弱网：显示“正在重连…”）

Toast 模式（实验开关）仅在关键节点显示：
┌  正在预排推荐点  ┐（不叠加，下一条覆盖）
└──────────────────┘
```

### 10.2 定位弹窗（待定位 Top-5）细化
- 搜索框支持模糊/拼音/简称；结果列表仅“名称+地址”
- 推荐区：Top-5 候选（按城市命中 > 名称相似 > 地址包含地标 > 连锁分店优先常去区域）
- 交互：点选即确认入库；返回列表保持滚动位置
- 展示限制：仅展示名称 + 地址（含商圈/地标）；不展示距离/时长/置信度/评分
- 语义说明：灵感库条目为素材池，与规划无关；不引入“更近/更快”的规划语境

手动录入兜底（FR44‑lite 对齐）
- 表单：名称（必填） + 地址/坐标（可选）→ 地理编码 → 入候选（低置信标记“待定位”）。
- 失败提示：
  - 地理编码失败：“未能解析地址 · 请检查后重试”
  - 网络失败：“网络异常 · 稍后重试”
- 直接落位：遵循硬约束/分段边界；失败给出原因并回退为候选。

### 10.3 Edge & Error States（关键场景）
- 剪贴板读取失败 → 文案 + “长按粘贴”教学
- SSE 断开重连 → toast + 指示当前阶段，重连后续传
- AI 填充失败/配额不足 → 保持骨架；引导分天或稍后
- 骨架冲突剩余 1 处 → 顶部 fix 条提供 1-2 个可落地选项
- 地图配额接近 → 降级：关闭热力圈/仅列表；提示“地图功能降级”
- AI 额度不足/降级 → AI 页顶部灰条提示 + 一键查看额度/稍后继续

## 10.4 实施补充（建议纳入）
- 地图 × 卡片抽屉三段吸附：列表主视 / 分屏 / 全屏地图；地图懒加载、Marker 聚合
- 可访问性与性能：触控目标 ≥ 44pt；遵循系统“减少动态效果”；LQIP + 渐进清晰；骨架屏统一；分屏时再加载地图
- 内容安全与去重：XHS 图片二次存储至 COS（禁热链）；文本 + 主图指纹去重；基础敏感内容检测
- 数据与回收：账号删除与数据导出（App 内可自助）；对象存储生命周期与孤儿文件清理；Postgres 备份与 PITR
- 埋点与特性开关：友盟漏斗（Auth.View → Ingest.Start/Persisted → Plan.Generate → Plan.InsertBlock → Plan.Finalize → AI.Fill.Apply → Export.Success）；远程开关（候选数量、地图默认高度、软冲突放行、CTA 智能时段）
- A/B 与排序策略：首屏版式（Hero+双列 vs 纯双列）、CTA 文案（加入行程 vs 加入 Dn·时段）；待定位 Top-5 后台排序按“城市 > 名称相似 > 类目 > 热度”，不外显得分与距离

### 决策落地（补充）
1) 城市 Tabs 排序：按“与目标城市中心点直线距离”排序；过滤灵感量 ≤1 的城市（不显示）
2) “用热门生成骨架”：删除此动作（不展示）
3) 近邻聚类特征：不引入“用户画像/常去区域”，保持“地理邻近 + 开放时间 + 主题标签”
4) 未落位清单：仅在“空槽 → 候选抽屉”中展示；骨架页不直接展示，提供“去定位”入口在相关卡片上
