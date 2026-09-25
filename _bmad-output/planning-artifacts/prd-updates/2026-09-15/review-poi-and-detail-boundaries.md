---
date: 2026-09-15
status: passed-planning-boundaries
reviewType: independent-focused-ir-prd-review
affectedRequirements: ['FR4.2', 'FR37', 'FR39']
affectedStories: ['1.11', '5.1', '5.2']
planningBlockingFindings: 0
implementationFollowups: []
resolvedFindings: ['PD-01']
revalidatedAfterCoordinateAmendment: true
formalSourceEditsApplied: false
runtimeVerified: false
prototypeGenerationRequiredThisReview: false
---

# 手工地点纠错与行程细节页面边界复核

## 结论

**本次规划边界复核通过，没有发现需要重新裁定产品范围的阻断。** FR4.2/Story 1.11 的人工事实层与 Provider 原始事实、固定版本消费、撤销和旧计划保护已对齐；Story 5.1 在完整 5.2 尚未交付时负责真实可达的最小 S10/S9/来源/返回，5.2 在同一路由与读取能力上增强，未再依赖未来页面才形成基本闭环。

初审发现的 **PD-01：坐标系协议精确化** 已由主任务补入数据/API/测试架构并同步镜像，本审查重新读取确认解决。当前没有未解决的文档边界问题；具体 schema/适配器和真实验证仍属于后续实施，不作为本轮生成 PNG 的前置条件。

本结论只针对所查规划契约，不代表服务、页面、真实来源接口、权限、数据库、缓存、图片或浏览器返回已经实现或验收。

## 输入与核验范围

本次重新读取了当前正式文件，而非仅采用此前方案报告：

- `docs/prd.md`：FR4.2、FR37/IR-09、FR39 与运营/细节正文。
- `_bmad-output/planning-artifacts/epics.md`：完整 1.11、5.1、5.2 GWT；关联回查 2.8 的普通 POI 详情/来源边界及 FR coverage。
- `docs/architecture/data-models.md`、`backend-architecture.md`、`rest-api-spec.md`、`frontend-architecture.md`、`testing-strategy.md`；定向回查 `planner-orchestration-v2.md` 的 Filler 边界。
- `docs/front-end-spec.md`、`docs/ux/mobile-ia.md`、`docs/ux/prototype-coverage.md`。
- 对应 BMAD `prd.md`、`architecture.md`、`ux.md` 镜像。

正式源只读；本次只写本报告。未读 PNG 像素、未生成图片、未执行业务代码、未请求外部服务、未修改其他 Story。来源行号对应本次读取快照；后续编辑可按节名/GWT 首句定位。输入哈希和计数记录在 `/tmp/nomad-ir09-poi-detail-review-20260915-inputs.json`。

## FR4.2 / Story 1.11 对齐矩阵

`E` 指正式 `epics.md`，`D` 指 `docs/architecture/data-models.md`，`B` 指 `backend-architecture.md`，`A` 指 `rest-api-spec.md`，`FA` 指 `frontend-architecture.md`，`F` 指 `docs/front-end-spec.md`。

| 检查点 | 现有依据 | 判断 |
| --- | --- | --- |
| 允许字段与真实操作者 | PRD:127、560；E:1030–1038；D:51–54；A:23–29；FA:11–17 | 通过。只对已存在 CanonicalPOI 的显示名、文字地址和同城坐标纠正；先有 Story 1.0 真实身份与服务端权限。没有客户端角色自证/任意 JSON/脚本/抓取 URL 通路 |
| 原始 Provider 快照与人工覆盖分离 | E:1032、1042–1043、1052–1053；D:51–57；B:22–25；F:473–477 | 通过。原始快照保留，人工字段来源不冒充高德；有效事实绑定 Provider 快照与修正版本，不是覆盖原始表后仍标 Provider 来源 |
| 坐标系与同城/门店身份 | E:1035–1038；D:53、59；A:27–29 | 通过。PD-01 补充已明确输入 CRS/来源、规范化结果及转换版本，未知体系发布前拒绝。禁止 Provider ID、城市、分店身份改绑，不能通过改显示名/坐标换成另一个地点 |
| 非允许字段不可推断 | E:1038；D:59–60 | 通过。营业/评分/价格/电话不因名称/地址/坐标修改被重写；原值可靠性不足仍为未知，不新增订位/营业承诺 |
| 保存草稿与明确发布 | E:1030–1043；A:23–27；FA:14–15；F:474–475 | 通过。保存不生效；检查/差异/后续影响明确，最终发布依有效权限与预期版本，成功后才显示已发布 |
| 发布的原子性与并发 | E:1040–1048；D:52–57；A:25–27；B:227–230 | 通过。修正版本/生效引用/审计回执作为原子发布边界。Provider 刷新或另一人工提交改变基准后保留草稿并重新检查，不部分成功 |
| 发布结果未知/重复/撤权 | E:1045–1048；A:25–27；FA:14–17 | 通过。同 operation 恢复原回执；未知不当成功/失败、不盲目重发，撤权和迟到响应不能继续读写私有操作记录 |
| Provider 后续刷新 | E:1050–1053；D:55–57 | 通过。新有效事实明确字段优先级，刷新不静默清除人工覆盖；整份事实绑定一个有效版本，不用新版坐标配旧版地址临时拼接 |
| 撤销人工覆盖 | E:1060–1063；D:57；A:23–27 | 通过。通过新版本解除选定字段或再次修正，保留历史，按当前事实/权限/预期版本检查；不撤销别人后续改动。Provider 值缺失/过期不能被撤销操作伪装成最新 |
| 地点/路线缓存版本 | E:1055–1058；D:60–61；A:30–32；B:227–230 | 通过。新消费者首次使用固定完整有效事实；路线缓存纳入两端事实版本。Provider 原始搜索缓存仍可以缓存原始结果，但应用有效事实时不能绕过已发布人工版本 |
| 旧导入、执行中任务和已发布计划不变 | PRD:127；E:1057–1058；D:61–62；A:30–32；F:477 | 通过。已固定任务沿原版本，旧 ImportRecord/Plan/Trip/Stay/路线/导出快照不被发布修改。后续用户采纳沿已有预览/确认/校验/revision，不自动重跑 |
| 普通卡和公共详情来源 | E:1053、1095–1098；D:62–65；A:28–29；F:476–477；关联 E:1596–1599 | 通过。卡片标题读取其绑定事实版本，不新增逐卡 Provider/质量徽章；详情可按字段查人工来源/时间，不公开操作者身份、内部理由全文或他人 evidence。后续 2.8 的“标准名称”应按这一有效事实合同消费，不能重新把整张 Sheet 都归因为高德 |
| 审计与用户数据生命周期 | D:63–65；E:1033、1048 | 通过。私有操作审计接入已有保留/删除边界，但全局地点事实不被当作某运营者的私人旅行记录级联删除；最小公开来源信息与受保护审计区分 |
| 依赖与额外运营工具范围 | PRD:558–561；E:1001、1030–1033、1113；FA:11–17；F:478 | 通过。依赖前序 1.0 的真实权限基线合理，不等待未来 8.6/通用后台。合并/别名/近邻/通用黑名单/任意重跑保持延期，品牌规则仍独立保留 |

## PD-01：坐标系协议精确化，已解决

初审时 `epics.md:1037` 已明确“校验坐标范围与坐标系”，而 data/API 摘要仅写 proposed values/same-city coordinate，没有具体输入 CRS 与规范化合同。本审查将其报告为当前功能的实施细化问题，没有要求扩大范围或引入新产品审批。

主任务随后补齐并同步了以下契约；本审查已经重新读取，而非仅依据口头完成通知：

| 同步位置 | 已补合同 | 复验 |
| --- | --- | --- |
| `docs/architecture/data-models.md:59–64` | 保存 `inputCoordinateSystem`、原始 point/source、规范化坐标系和值、`transformPolicyVersion`；现有 geo adapter 负责允许列表和版本化规范化；未知/不支持不猜测，规范化后检查范围/同城/身份；仅一对裸数字不允许发布 | 通过 |
| `docs/architecture/rest-api-spec.md:30–36` | API 要求真实坐标系/来源 discriminator，保留原输入，明确转换和版本；未知体系发布前失败，同城/门店和路线使用规范化版本 | 通过 |
| `docs/architecture/testing-strategy.md:131–135` | 增加受支持体系规范化/版本、缺失/未知体系、范围错误和规范化后同城 fixture；裸数字不能发布 | 通过 |
| `_bmad-output/planning-artifacts/architecture.md` 对应三源段 | 与上述当前正式源文本一致 | 通过 |

此前要求已经有可执行的契约归属：具体允许体系/输入 UI/转换适配与 schema 随 1.11 实施验证，不在本报告未经实际供应商合同核验固定厂商参数。该实现工作与所有尚未开发的 Story 一样保留，但 PD-01 的本次文档遗漏已关闭。

## 5.1 / 5.2 对齐矩阵

本次完整读取 5.1/5.2，而非仅统计数量。5.1 包含 24 组 GWT；5.2 包含 23 组。

| 检查点 | 现有依据 | 判断 |
| --- | --- | --- |
| S7 正常可达入口 | E:5.1 Delivery boundary、新增首组与原入口组；F:337–342；FA:29–34；M:453–456 | 通过。5.1 自己交付非占时间轴纵向的计划级入口与最小 S10，不依赖完整 5.2，也不新增编排完成中间页 |
| 无 FillRun 可读基础行程 | E:5.1 新首组；PRD FR37 后 IR-09 边界；A:97–102；F:338；M:454 | 通过。基础行程按 exact owner/current revision 读取，与内容是否完善独立；单城/Trip/DayExcursion 结构保持真实 |
| S10→S9→原 S10 返回 | E:5.1 入口/平台限制/“S9 已收到槽位结果”组；F:339–340；FA:30–32；M:455–456 | 通过。complete/partial/failed/主动返回均由 5.1 负责，恢复同日期、scope、有效锚点/焦点；只有用户选择修复/编辑才转 S7/S8 |
| 深链缺父上下文 | E:5.1 深链组；A:99–102；FA:31–32；F:340 | 通过。按 owner/aggregate/revision 建立安全默认父上下文，不依赖未来最近行程元数据，不信任任意返回 URL；失权目标不为回环而强行读取 |
| current 已变化 | E:5.1 run 期间版本变化组、5.2 stale/刷新组；F:342；FA:34 | 通过。旧 run 不附着新 revision；安全旧阅读快照可提示刷新，刷新后仅恢复仍有效范围，不混拼 Trip 成员、不自动重跑 |
| S9 当期最小来源真实可用 | E:5.1 新来源组、原无可靠来源组；A:97–101；F:340；M:453–456 | 通过。已要求实际 owner/revision/citation ACL 下的身份/归因/安全摘要/观测信息，不只给未来 CitationSheet 的占位链接 |
| 来源缺失/失效/越权 | E:5.1 新来源组三个 Then/And 与 citation 组；5.2 对应来源组；A:98 | 通过。安全通用内容轻提示；没有真实依据不伪造条数/链接。来源不可读只影响局部，不能绕过 ACL 或泄露其他 owner 存在性 |
| 弱提示与主流程 | PRD FR39；E:5.1/5.2 `建议核对` GWT；F:351–355；M:464–466；V:451–455 | 通过。行内“建议核对”、无反复 Toast/弹窗/逐条确认；无法安全表达仍“暂未生成”，没有将此前未批准的全局提示提案自动套用 |
| hard / soft / unknown | E:5.1 新首组及 gate 组、5.2 整体核查/冲突组；F:342、346–347；A:97–102 | 通过。hard/不完整交通等继续阻止新完善/导出，只读基础不隐藏；soft 可继续；缺失/读取失败不冒充无冲突。没有为读页面重复创建 ValidationRun |
| 单一 ResultSheet 与引用权威 | E:5.2 Delivery boundary、首组/入口/整体核查/citation 组；FA:32–34；A:100–102 | 通过。5.2 扩充同一路由、基础读模型、来源权限与事实，不再首创另一个页面/第二套 ACL/Validator |
| 5.2 仍有明确独立增强价值 | E:5.2 两行核查、POI-only 总览、槽位内容页、CitationSheet、完整状态恢复与关单组 | 通过。最小 5.1 没有吞掉完整核查/槽位阅读/引用交互。5.2 的原能力与 23 GWT 保留，不以 5.1 简介替代完整引用验收 |
| 导航零业务副作用 | E:5.1 新首组、入口/返回/关单；5.2 回归关单；A:99–102；FA:34 | 通过。查看/展开/恢复不新建 FillRun、ValidationRun 或排期 revision。5.2 的幂等漏斗到达记录与业务生成分开，不作为 5.1 可读条件 |
| 无提前实施 5.3/5.4/5.5 | E:5.1 排除项、5.2 排除项；F:341 | 通过。最小闭环不提前提供 user override/恢复 AI/导出/分享，仍保留 Filler 不改排期的原约束 |
| 可验证关单 | E:5.1 最后 GWT、5.2 回归关单；`testing-strategy.md:136–138` | 通过。明确在 5.2 未交付情况下走完整链并真实读来源；覆盖 hard/soft/unknown、失败/stale、深链/无效锚点与来源拒绝 |

其中 `M` 为 `docs/ux/mobile-ia.md`；`V` 为 `docs/ux/prototype-coverage.md`。GWT 范围按首句定位，避免主任务后续增加前文导致行号失效。

## 原型与页面范围：不新增本轮 PNG 阻断

1. `prototype-coverage.md:431–435` 已把 1.11 手工纠错的新表单/发布/恢复列为 **1.11 UI 实施时** 的桌面证据要求。现有品牌规则/POI 图是部分参考，不声称已画出纠错表单；没有要求本次 PRD Update 先生成所有 PNG。
2. `prototype-coverage.md:437–442` 与 5.1 原型 GWT 已把最小 S10/入口/来源/返回纳入 **已有的 5.1 pre-UI checkpoint**。本轮责任澄清通过，不等于该 checkpoint 已通过；也不应为本轮文字评审另加新原型审批。
3. 手工地点维护只要求桌面 Web。`mobile-ia.md` 没有增加运营纠错手机页面是符合范围，不是缺口；运营说明位于 frontend spec/architecture/prototype coverage。
4. 5.1/5.2 的旅行者页面继续遵守移动端可访问性与恢复要求。运营“无需移动适配”不能误用于旅行者 S9/S10。
5. 图中已有布局、弱提示或普通来源归因不能越过文本 ACL/版本/门禁；没有读 PNG 像素就不能声称新文案已经出现在图片里。

## 同步与结构核验

- `docs/prd.md` 与 `_bmad-output/planning-artifacts/prd.md` **字节一致**。
- `architecture.md` 中当前 frontend/backend/data/API/testing 五个来源段与各正式源 **一致**。
- `ux.md` 中 front-end-spec/mobile-ia/prototype-coverage 三个来源段与各正式源 **一致**。
- 1.11 的 Given/When/Then 各 **22**；5.1 各 **24**；5.2 各 **23**，结构计数一致。
- FR4.2 有 PRD 定义、Epics requirements inventory、coverage 和 Story 1.11 映射；FR37 明确新增 5.1 最小切片且保留 5.2/5.3 责任。
- 未发现 1.11 为使用人工事实必须等待 8.6、或 5.1 为进入/返回/读取来源必须等待 5.2/7.1 的新前向依赖。

## 应保留到实施的证明责任

规划层已规定而本轮没有执行的验证包括：真实运营身份/ACL、Provider/人工并发与未知回执、端点版本缓存隔离、旧计划/导出不被改写；以及 5.1 独立入口/来源/返回、浏览器实际上下文恢复、最小来源读取/撤权、真实 PG 与当前 revision gate。坐标体系/转换 fixture 随 1.11 实施，文档上的 PD-01 已补齐并复验通过。

结论可用于更新本次 IR 整改的“合同责任已明确/源包已同步”状态，不能用于把对应 Story 或生产能力直接标成 done。
