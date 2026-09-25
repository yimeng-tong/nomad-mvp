---
date: 2026-09-15
status: applied-to-epics
decisionBasis: user-approved-ir-09-page-responsibility
affectedStories: ['5.1', '5.2']
sourceEditsApplied: true
appliedFiles: ["_bmad-output/planning-artifacts/epics.md#story-5.1", "_bmad-output/planning-artifacts/epics.md#story-5.2"]
appliedDate: 2026-09-15
implementationStatus: not-started
implementationEvidenceComplete: false
newGwtCount: 2
story51GwtCountBefore: 22
story51GwtCountProposed: 24
story52GwtCountBefore: 23
story52GwtCountProposed: 23
implementationAuthorized: false
---

# IR-09：5.1 最小 S10 宿主页与 5.2 增强边界

**应用记录（2026-09-15）：** 本方案已按主审接受结果局部应用到正式 `epics.md` 的 5.1/5.2 区块；5.1 从 22 增至 24 组 GWT，5.2 保持 23 组。其余 Story、Requirements Inventory 与文件元数据保持不变；PRD/UX/架构同步由主任务另行完成。以下保留修改方案与评审依据，已应用于合同不表示功能、原型或实施验收已完成。

## 结论与范围

建议由 Story 5.1 同时交付可达的最小 S10 宿主页、S9 完善界面及返回链，并在 S9 提供最小的实际来源查看。Story 5.2 在同一路由、同一基础行程读模型和同一返回上下文上增强完整 `整体核查`、槽位阅读页与 CitationSheet。

正常入口固定为 **S7 的既有计划级入口 → S10 基础行程 → S9 → 原 S10**。S7/S8 不增加细节状态卡、底部完善 CTA，也不占 POI 瀑布或 HotelFooter 的纵向空间。直接 S9 深链与任务恢复仍经过鉴权、目标和版本检查，并能恢复或建立合法的 S10 父上下文；不强制打断恢复去播放一遍页面导航，不自动启动新 FillRun。

这是既有已批准页面流程的交付责任澄清，不是新建一套临时结果页。最小宿主页不等于完整 5.2：不提前承接完整核查呈现、S10 槽位内容阅读/引用 Sheet、用户内容编辑、导出或最近行程。

## 已读取的合同证据

以下定位基于本审查读取时的正式 `epics.md`；后续同步可能移动行号，合并应以 Story 与 GWT 首句定位。

| 证据 | 当前内容 | 需要闭合的责任 |
| --- | --- | --- |
| `epics.md:3682–3803`，5.1，共 22 GWT | 有受保护 S9 路由/恢复链接，但正常入口写在未来 S10 `整体核查`；排除项又写不实现 ResultSheet 整体核查 | 明确 5.1 自己完成最小 S10 入口/基础页/返回，排除项限定为“完整核查增强” |
| 5.1 原 AC11 | 无来源安全建议显示 `建议核对`，但“依据可稍后在 S10 槽位详情/来源中查看” | 当前 5.1 必须有实际可用的轻量来源查看，不能用未来 CitationSheet 作为可追溯闭环 |
| 5.1 原 AC17/18 | S9 完成、部分完成、失败返回 S10；深链允许回 current plan | 宿主页归属、深链默认父上下文、stale/失去访问权的合法恢复目标需明确 |
| 5.1 原 AC21/22 | S9 运行原型 checkpoint；关单核验没有明确“5.2 未交付时全导航链已可走通” | 原有 checkpoint 补最小 S10 与来源展开；真实关单证据覆盖独立闭环 |
| `epics.md:3805–3932`，5.2，共 23 GWT | S10 基础行程、两行整体核查、内容页、来源、返回和恢复全包 | 从“首次交付所有 S10”改为“在 5.1 的最小宿主页上增强”，保留自身 23 GWT 的业务目标 |
| `implementation-readiness-report-2026-09-14.md:1150–1154、1189` | IR-Q02/IR-09：现有移动代码无可确认 S10；需明确最小页面责任 | 可在合同责任层关闭歧义；不能据此把运行验收标记通过 |
| `docs/front-end-spec.md:90、337–346`；`docs/ux/mobile-ia.md:37–39、453–461` | 非占时间轴入口、S10→S9→原 S10、弱提示均已批准 | 保持最终流程，补分阶段责任 |

## 责任表

| 能力 | Story 5.1 必须可用 | Story 5.2 增强 |
| --- | --- | --- |
| 进入 S10 | 从 S7 既有非占位计划级入口进入；无 FillRun 仍能阅读基础行程 | 复用入口，不创建第二路由/临时页或改变编辑区布局 |
| 基础宿主页 | 读取 exact current owner/PlanRevision 或完整 TripRevision；显示只读日期、scope、时间/地点/交通/住宿/行李与一日游边界；保留日 Tab/浏览锚点 | 完善紧凑 POI-only 总览、必要缩略图、HotelFooter 及槽位阅读入口；复用基础数据 |
| S9 动作与状态 | 一个计划级细节动作，可进入、继续或查看实际 run；仅展示已部署状态与恢复动作 | 在 `整体核查` 的稳定两行中完整组织 `时间安排` 和 `行程细节` 的数量、状态和下钻 |
| 时间 gate | 读取同 revision 的现有 ValidationRun 与结构边界；hard 禁止创建 FillRun并提供已有修复入口；soft 可继续且有轻量摘要；unknown 不伪装成通过 | 完整核查行和返回 FixSheet；继续消费相同事实，不额外运行 Validator |
| 来源 | S9 对已生成内容提供最小按需展开，实际读取经过 owner/revision/citation ACL 验证的身份、归因和安全摘要；必要安全来源动作复用已交付能力 | S10 槽位内容页与 CitationSheet 的完整组织、来源列表/数量、逐项展开、统一失效恢复 |
| 返回/恢复 | S9 完成、partial、failed、主动返回回原 S10；页面重开按允许上下文恢复；当前版本变化遵守安全刷新/旧结果隔离 | 延续同一恢复契约，完善 S10 槽位焦点和完整核查状态 |
| 不在本责任内 | S10 完整核查/槽位阅读 UI、逐条 user override/再次完善用户原文保护、导出/分享、最近行程、check-in | 不重新实现 Filler/FillRun，不提前承接 5.3/5.4/5.5 |

最小宿主页可复用最终 S10 的标题、日期导航、基础行程与细节动作布局。不能为了避免前向依赖，自行设计一个需要用户再次确认“编排完成”的中间页。未交付的完整核查/内容/引用能力不提供假按钮；5.1 的 S9 最小来源展开承担当期实际可核查性。

## 建议仅新增两组 GWT

新增组 A 建议放在 5.1 原 AC1 之前；新增组 B 建议放在原 AC10（citation 持久化）之后。现有 AC 编号在本报告仅用于定位，不要求正式文件显式编号。

### 新增 A：5.1 自己交付最小 S10 宿主页

**Given** Story 5.1 已部署、Story 5.2 的完整行程单增强尚未交付，且 owner 拥有 current、已发布并可合法浏览的独立 PlanRevision 或完整 TripRevision
**When** 用户从 S7 既有、不占 POI 瀑布或 HotelFooter 纵向空间的计划级行程单入口进入 S10
**Then** 本 Story 的同一 S10 路由先展示 exact owner/revision 的只读基础行程、日期与 segment/host-child scope，以及通向 S9 的最小计划级行程细节动作；是否存在 FillRun/SlotDetail 不影响基础行程可见性
**And** 基础行程保留权威时间、槽位、主链交通、一日游去返、住宿/行李与日期边界；只读取同 revision 已有的 ValidationRun 和细节运行事实来展示真实 gate/状态，不因打开 S10 创建 ValidationRun、FillRun、排期 revision 或第二套结果真相
**And** 未解决 hard conflict、无效交通或不完整原子引用保持原完善门禁并提供已交付修复入口，soft warning 用非阻断摘要并允许继续，检查读取失败/缺失不冒充已通过；S7/S8 不增加细节状态卡/底部完善 CTA，未交付的完整核查、槽位阅读或 CitationSheet 不提供占位入口

### 新增 B：5.1 的 S9 最小来源读取可独立使用

**Given** owner 正在 S9 浏览当前绑定 revision 中已生成的槽位内容，Story 5.2 的 CitationSheet 尚未交付
**When** 用户按需展开该内容的来源依据
**Then** 本 Story 通过 owner、slot/revision 与 citation ACL 检查，提供紧凑只读展开，展示真实可访问的来源身份、source attribution、相关最小安全摘要及适用的观测时间；已有允许的来源/导入记录查看动作复用实际可用的鉴权能力，不能只显示等待未来页面的占位链接
**And** 无可靠来源的安全通用内容仍以 `建议核对` 作次要行内提示，并在主动查看依据时说明暂无可核对来源；不伪造来源数量、摘要、预约证据或短链，也不要求逐条核对后才能继续使用行程
**And** 来源删除、失权、过期或读取失败时局部显示 `暂时无法查看` 与真实重试/收起路径，保留合法内容和阅读上下文；不能回退原始受保护 URL、泄露其他 owner 存在性或依赖 5.2 才能验收来源读取

说明：该组复用 5.1 原已要求的 citation read 与持久来源字段，新增的是当期可达的呈现和验收责任。它不新建第二来源 API 真相，也不提前构建 S10 的完整槽位内容页/来源 Sheet。

## 5.1 原 GWT 与元数据精确修订建议

### Requirements 与 Story 意图

Requirements 增补 `FR37 (minimum S10 host/entry-return slice)`，保留已有 FR10/FR39/FR49。Story 的 As a / I want / So that 可以保持；增加一条范围说明即可明确宿主页责任：

> **Delivery boundary (IR-09, 2026-09-15):** 本 Story 同时交付 S7 既有计划级入口可达的最小 S10 基础行程宿主页、S10→S9→原 S10 返回链及 S9 最小鉴权来源展开。Story 5.2 在同一路由/读模型上增强完整核查、槽位阅读和 CitationSheet；不作为本 Story 的入口、返回或基本可核查性前置条件。

AR/UX 追踪引用按正式编号定义复核，只追加最小宿主页实际消费的映射，不以“新增页面责任”推导新增数据库/平台 Story。

### 原 AC1：入口

替换原 When/Then/And 为：

**When** 从本 Story 已交付的最小 S10 宿主页行程细节动作进入，或经受保护的 S9 深链/原任务恢复入口继续
**Then** 在明确绑定的 current revision 上打开 S9，正常产品路径保持 S10→S9；深链/恢复先验证 owner、目标及当前状态，并恢复或建立合法的 S10 父上下文，不经过独立“AI 已完成编排”中间页，也不把完善设为初始规划完成的阻塞步骤
**And** S7/S8 不渲染细节待完善/已完善卡片或底部 CTA；只读打开、深链恢复及返回不自动开始新 FillRun，目标及父上下文使用稳定 id/revision、日期、segment/host-child scope 和安全滚动锚点，不从城市名称或任意客户端返回 URL 推断

### 原 AC2：gate 责任补充

保留原 hard/soft 门禁。在原 And 后补：

**And** 最小 S10 宿主页与 S9 读取同 revision 的既有 ValidationRun/结构事实；当前检查缺失、读取失败或绑定过期时仅显示真实检查/恢复状态并按既有 gate 拒绝无法证明可接受的新完善请求，不因导航或“整体核查”展示重复启动校验

这里不是新增业务 hard 规则，只明确不能把未知状态当通过。任何需要刷新校验的操作仍进入既有所属流程。

### 原 AC11：无来源弱提示

将末句“依据可稍后在 S10 槽位详情/来源中查看”改为：

> 本 Story 已提供 S9 的最小来源/依据展开；用户可以先继续使用基础行程，再按需在 S9 查看。Story 5.2 后续将同一事实增强为 S10 槽位详情与 CitationSheet，不改变 `建议核对` 的非阻断语义。

原 `暂未生成` 与不得伪造事实/来源的 And 保留。

### 原 AC14：run 期间 current 改变

保留旧 run 不附着新 revision 的原合同，补一句：

> 返回 S10 时重新核对 current 指针；原 revision 仍可合法读取时可保留正在阅读的安全旧快照并提示刷新，新 current 展示走既有刷新规则。刷新后仅恢复仍有效的日期/scope/锚点，失效处回到有效父上下文，不拼接两版成员，也不自动重新完善。

### 原 AC16：失败动作名称

将通用 `返回计划` 收敛为此流程主返回 `返回行程单`；需要修复排期时另由原 `查看冲突/返回编辑` 进入已有 S7/S8。保留真实稍后/重试动作，不增加额度暴露，不把无法继续误说成已排队。

### 原 AC17：完整返回链由 5.1 验收

原 Then（S9 分槽位状态/弱提示）保持。替换 And 为：

**And** S9 不提供排期编辑、地点替换、user override、恢复 AI、ResultSheet 完整核查或导出；完成、部分完成、失败及用户主动返回都回到本 Story 已交付的同一 S10 宿主页，恢复进入前日期、segment/host-child scope、有效滚动锚点和触发焦点，并只重读对应运行/当前版本状态，不创建新 FillRun 或排期 revision；只有用户明确选择修复/编辑才进入既有 S7/S8

此处移除含糊的 `ResultSheet completion`。5.1 不因完成 FillRun 标记整趟已核查/旅行已完成。5.2 原 AC17 的 S10 漏斗到达状态增强仍按其合同交付，不作为 5.1 基础阅读回环门槛。

### 原 AC18：深链与父上下文丢失

保留原鉴权、stale/not-found/无权限语义，补：

> 合法 S9 直接恢复没有现成父视图时，以鉴权解析后的稳定 aggregate 与当前可用 revision 建立默认 S10 日期/scope 返回上下文；不能要求调用者依赖 Story 7.1 最近行程元数据或未来 5.2 页面。目标删除/失权时使用既有统一不可用状态与安全导航，不能为完成回环读取不可访问行程。

### 原 AC20：无障碍

将 Given/When 覆盖范围由“进入并浏览 S9”扩展到“通过 S7 计划级入口使用最小 S10、S9、最小来源展开并返回”，延续 44pt、键盘/读屏、焦点、安全区与 reduced-motion 要求。其余不变。

### 原 AC21：原型 checkpoint

Then 替换建议：

**Then** 在既有 S9 运行状态 checkpoint 中同时确认 S7 非占时间轴计划级入口、最小 S10 基础宿主页/细节动作、S9 生成中/断线恢复/partial/建议核对/failed/stale、最小来源展开以及返回原 S10 日期/scope/滚动的连贯原型；沿用已批准 Overall Check R1 的最终入口层级与现有基础行程视觉，不提前声称完整 5.2 已交付

And 继续保留旧 `story-5-1-detail-entry-states-r1.png` 不指导实现、不复用完成中间页的限制。原 PNG 不因修改文本就成为新状态的已验证原型。

### 原 AC22：关单与排除项

原 When 的 fixture/测试中补以下必要范围：

> 在 Story 5.2 尚未交付的配置下实际走通 S7→最小 S10→S9→同 S10；包括无 FillRun、hard/soft/未知检查、单城/联程/一日游、complete/partial/failed/主动返回、深链缺父上下文、current 更新、合法来源展开及无来源/来源失效、返回同日期/scope/滚动/焦点。核实导航不新增 FillRun/ValidationRun/PlanRevision，不依赖未来页面或 mock 来源入口。

Then 增补“并能从基础行程实际进入、查看依据及回到原上下文”。排除项替换为：

**And** 本 Story 只交付最小 S10 基础宿主页、细节动作和返回闭环及 S9 最小来源展开，不交付 Story 5.2 的完整 ResultSheet 双行核查/槽位内容页/CitationSheet 增强；也不实现 user override、重新完善时的用户原文保护、图片导出、保存/分享、餐饮/清单扩展、最近行程或 check-in，不提供恢复 AI 功能

## 5.2 原 GWT 精确修订建议

不新增 GWT，不删除现有 23 组的事实/权限/gate/恢复要求。原有“基础可读”“无细节可读”成为对 5.1 基线的增强与回归责任。

1. **Requirements：** `FR37 (read-only ResultSheet slice)` 改为 `FR37 (full checks/slot reading/citation enhancement over Story 5.1 minimum host)`。
2. **新增范围说明：** “复用 Story 5.1 已交付的 S10 路由、基础行程读取、S9 动作、最小来源 read 与父上下文。增强完整核查与 S10 阅读/来源呈现，不另建 ResultSheet/ValidationRun/引用权威，也不重复首个 S10 入口交付。”
3. **原 AC1 Then 前置：** “在 Story 5.1 最小宿主页基础上增强同一 ResultSheet”。保留 exact owner/current revision 与基础读取，以及 FillRun 不存在也可用。
4. **原 AC2 Then：** “沿用 Story 5.1 已交付的同一计划级入口，不新增第二入口”；不占纵向、不加状态卡/底部完善 CTA 保持。
5. **原 AC3 Then：** “在最小宿主页上增强日期 Tabs 下的完整 `整体核查`，使用两个稳定行……”。继续复用 current ValidationRun，不合并时间状态/细节状态，不新增校验。
6. **原 AC9/10：** 明确 CitationSheet 复用 5.1 的 owner-checked citation read 与字段，新增的是 S10 来源列表/内容关联呈现；不能 fork 一套 ACL 或因已有 S9 简介跳过完整引用验收。
7. **原 AC14：** “继承并验证 Story 5.1 的原 S10 父上下文返回，补齐槽位内容焦点和完整核查重读”；保留 same revision/不重跑/不跳 S7。
8. **原 AC17：** 首次到达 S10 的漏斗/非排期状态按本 Story 增强交付，幂等且不回填虚构的历史完成；不把该状态作为 5.1 最小 S10 可读性的条件。
9. **原 AC22：** 视觉说明写“在 5.1 已通过的最小 S10/S9 连贯原型上，采用 Overall Check R1、Citations R3、States R2 增强本 Story”。保留文本优先及 superseded 限制；5.1 的既有 checkpoint 由 5.1 完成，不要继续写成 5.2 开发时才补 5.1 可达入口。
10. **原 AC23：** 增加“不回归 5.1 独立入口/来源/原上下文返回，沿用同一 read model”；其余关闭与排除项保持。

## PRD / UX / 架构同步点

| 文件/定位 | 精确同步目的 |
| --- | --- |
| `docs/prd.md` FR10/FR37、§7 行程细节完善（约 132、189、551–557 行） | FR37 添加交付切片：5.1 最小宿主页+来源/返回；5.2 完整核查/阅读。最终用户流程仍 S10→S9→原 S10，不更改功能范围 |
| `docs/prd.md` 页面验收约 762–763 行 | “S9 预览并应用”不得解释为又一份需采用的结果；沿既有真正持久状态/只读查看。补最小宿主页责任，不创建新确认阶段 |
| `docs/front-end-spec.md` Route/Navigation 约 90–92 行、Detail/Result 337–346 行 | 5.1 在同一 S10 路由提供入口/基础宿主/返回，5.2 增强完整两行；S9 来源展开当前可用，不能把唯一来源入口指向未交付页面 |
| `docs/front-end-spec.md` Component Contracts（ResultSheetOverallCheck/ResultSheet） | 注明基线/增强责任，禁止复制路由/读模型；不要把完整组件清单等同 5.1 必须实现全部 |
| `docs/ux/mobile-ia.md` 顶部导航 37–39、3.16 453–461 行 | 保持 S7 非占位计划级入口、S10→S9→原 S10；分清无父上下文的深链恢复，保留同日期/scope/锚点，弱提示不变 |
| `docs/ux/prototype-coverage.md` S9/S10 表、运行状态 P0 和未覆盖项（约 25–26、428–431、460、498–499、574 行） | 扩充既有 5.1 原型 checkpoint 的入口/宿主/来源/返回矩阵；5.2 图约束最终增强；文字责任澄清不等于 PNG/实现已通过 |
| `docs/architecture/frontend-architecture.md` Route/State/Component（约 19、26、60 行） | 同一 S10 route/query identity；父上下文独立于排期，owner/aggregate/revision/date/scope/anchor 有效性；5.1 最小 S9 来源 view 与 5.2 CitationSheet 共享读取能力 |
| `docs/architecture/rest-api-spec.md` Detail and Export（约 133–138 行） | 5.1 可读取 exact 基础行程、已有 gate/FillRun 状态及最小 citation view；5.2 扩充组合查询/呈现；没有第二 ValidationRun 或平行 citation 权威，不提前固定新接口名 |
| `docs/architecture/testing-strategy.md` Detail/弱提示回归（约 40–42、87–89 行） | 新增 5.1 在 5.2 未交付时的完整可达链与来源 ACL/无来源/失败/stale/返回测试；导航零生成/零排期副作用 |
| `_bmad-output/planning-artifacts/prd.md`、`architecture.md`、`ux.md`、`epics.md` | 按来源同步镜像；5.1 22→24，5.2 23 不变；FR37 coverage增加 5.1 最小切片，不反向删除 5.2 |
| 当前 IR 报告/整改追踪、CURRENT/project-context | IR-09 可更新为“页面责任已明确，实施仍待证据”；CE/历史 IR 的旧统计属于快照，不伪改成此前已含新增 GWT；不动历史 Sprint 完成状态 |

## 评审风险与验收边界

- **临时页面膨胀：** 如果 5.1 复制完整 5.2 再替换，增加重做且造成入口漂移。用同一路由/基础视图渐进增强；最小宿主只承担读基础行程、实际 gate、进入/返回。
- **来源名义可用：** 只存 citation ID 或显示“稍后去 S10 看”，不能满足 5.1 的基本可追溯性。最小 S9 展开须真正可读安全摘要，失权/失效处理也在 5.1 内完成。
- **不重复校验不等于忽略 gate：** 从现有 ValidationRun 读取当前事实；缺失/读取失败不能当无冲突，不因页面打开补跑第二次校验，不把 soft 提醒升级 hard。
- **版本与返回：** “返回原 S10”意为保留合法阅读上下文，不等于始终强行显示过期/失权内容，也不允许混合新旧 Trip 成员。current 更新按原刷新规则，失效锚点回有效父上下文。
- **恢复不等于新生成：** 直接 S9 深链、App 恢复、S10 返回以及来源展开均不新建 FillRun；真正重新完善须由用户明确选择并复用原幂等/预算合同。
- **上线能力诚实：** 5.1 已提供的基础阅读/来源功能是真能力，未交付 5.2 的按钮不出现假入口。5.2 上线后不改变旧 route identity 或回环，不重复计入“首个入口”交付。
- **5.1 已有长度：** 新增两组后 24 GWT。应在 CS 内划分实现任务顺序：最小宿主/上下文 → 已有 FillRun 及 S9 → 最小来源/恢复 → 真实验证；不再拆出一个数据库/平台前置 Story，也不擅改 Sprint。
- **授权边界：** 用户认可的是页面责任澄清。本次仅应用文档合同，没有生成图片、修改业务代码、调用模型/外部服务，不能作为 Story 实施关闭或生产部署证据。

## 前台评审文字摘要

1. 5.1 从 S7 已有行程单入口就能打开最小 S10，先阅读基础行程，再进入 S9 完善细节。
2. 5.1 完成、部分完成、失败或返回后，都回到原 S10 日期、城市/一日游范围和浏览位置；直接恢复也有可用返回页。
3. 5.1 的 S9 已能按需查看真实来源摘要，缺来源仍是“建议核对”，不等 5.2 才能核对依据。
4. 5.2 在同一页面上增强完整时间/细节核查、槽位内容页和引用 Sheet。
5. 硬冲突及过期版本保持原门禁，soft 提醒可继续；打开和返回页面不会重复校验、重新生成或改行程。
6. S7/S8 不增加细节卡或底部完善按钮；现有原型 checkpoint 补齐最小页面链后再做实现验收。

## 正式应用验证

仅改正式 `epics.md` 的 5.1/5.2 区块；应用前后其余 57 张 Story 内容相同，两个区块之外的全部正文、Requirements Inventory 和 metadata 相同。Story 1.11 保持本次应用前的 22 组 GWT。5.1 的 Given/When/Then 各 24 条，5.2 各 23 条。

以下首句定位的是本次变更过的 GWT；未列出的原 GWT 保持逐字不变。新增共两组；无障碍组只是扩写首句，不能算第三组。


### Story 5.1

- 新增：Story 5.1 已部署、Story 5.2 的完整行程单增强尚未交付，且 owner 拥有 current、已发布并可合法浏览的独立 PlanRevision 或完整 TripRevision
- 修订：owner 拥有一份 current、已发布且可安全浏览的 PlanRevision 或完整 TripRevision
- 修订：当前 revision 存在未解决 hard conflict、无效主链 transfer、缺失一日游返程或不完整原子引用
- 新增：owner 正在 S9 浏览当前绑定 revision 中已生成的槽位内容，Story 5.2 的 CitationSheet 尚未交付
- 修订：`做什么` 没有足够可靠的事实来源
- 修订：用户或另一设备在 FillRun 期间发布了新的 PlanRevision 或 TripRevision
- 修订：用户额度、并发、成本预算、Provider timeout 或 circuit breaker 限制本次完善
- 修订：S9 已收到槽位结果
- 修订：S9 通过深链、鉴权恢复、后台切回或旧 run URL 打开
- 修订：用户使用触控、键盘、读屏或 reduced-motion，通过 S7 计划级入口使用最小 S10、S9 与最小来源展开
- 修订：ResultSheet Overall Check R1 已确定 S10 到 S9 的入口，但当前视觉注册表仍缺少 S9 运行状态原型
- 修订：Story 5.1 准备关闭
- 首句替换说明：原“用户使用触控、键盘、读屏或 reduced-motion 进入并浏览 S9”扩为 S7 入口、最小 S10、S9 与最小来源展开的无障碍验收。

### Story 5.2

- 修订：owner 拥有一份 current、已发布且可浏览的单城 PlanRevision 或完整 TripRevision
- 修订：用户仍在 S7/S8 编辑时间轴
- 修订：ResultSheet 已绑定 current revision
- 修订：内容页包含一个或多个当前 owner 可访问的 citation references
- 修订：citation 指向高德地点事实、官方页面或 owner 导入记录
- 修订：S9 对精确 current revision 完成、部分完成、失败或恢复
- 修订：ResultSheet 首次成功呈现 owner 的 current revision
- 修订：Story 5.2 进入 UI 实现
- 修订：Story 5.2 准备关闭
