---
project: nomad-mvp
date: 2026-09-17
status: passed-after-corrections
scope: sprint-planning-to-prd-and-epic-delivery
implementation_started: false
fixed_findings: 4
open_findings: []
production_ready: false
---

# SP承接复核

复核来源包括当前PRD、正式Epics全文、SP状态/迁移/工程条件、BMAD后续工作流，以及已读取的「继续 Nomad 主开发线程」最新六轮用户决定与最终交接。旧助手结论未作为需求覆盖的替代证据。

## 已确认的问题与修正

1. **执行状态被永久固定。** 原检查对当前1.0/backlog、全部目标无实施文件、全部授权false及固定当前分支作永久断言。获准create-story后也会失败。保留原SP快照验证，当前检查改按实际文件/合法状态/当前授权/下一准备指针验证；不因本次修复授予实施权限。
2. **3.1可能被通用发现流程漏掉。** create-story只选backlog，新3.1继承in-progress不会被选中。用原准备顺序中的首个未准备合同作为指针；3.1准备只补当前合同，保留在制状态与暂停，开发阶段继续检查上游与keep/change/remove证据。
3. **FR14子能力没有具体首次交付责任。** 已批准PRD仍要求U-Link/U-App及归因，但正式GWT没有点名这些集成，当前代码定向检索也未发现对应接线。补入1.0登录归因、1.6深链/输入归因的create-story任务与真实证据要求，8.1汇总；不以泛称FR14、埋点wrapper或Sentry/Langfuse代替。适用宿主/供应商能力在对应Story准备时核验，不静默延期、不新增原生App。
4. **需求追踪缺少逐条可核对关系。** 原检查只计65FR/24NFR和Story数量。新增完整映射与双向绑定，补出FR9初始校验由2.11交付、NFR19由2.7已有GWT承接、NFR7地图版权由2.7统一容器首次承接；工程条件/真实验收保持独立。

## 复核结论

**修正后，SP可以继续承接当前PRD与8个Epic的后续交付。** 这是需求与执行跟踪的复核结论，不是功能、真实服务或生产开放验收。

当前：[Sprint状态](sprint-status.yaml) · [完整交付映射](sprint-delivery-contract-2026-09-17.yaml) · [CURRENT](../../CURRENT.md)。原[迁移记录](sprint-migration-2026-09-15.md)作为9月15日完成快照保留；本轮修改前的6个文件及指纹已留在 `archive/sp-revalidation-2026-09-17/`。

- 60张正式Story（7历史、53当前目标）、1018组GWT、65FR（61MVP/4延期）与24NFR保持；未把工程条件、覆盖报告、旧草稿或图片加入产品Story队列。
- 当前仍为7 done、3.1继承in-progress且暂停、52 backlog，0 ready-for-dev。旧2.2只留一个新执行身份，原baseline与Git分支历史保持。
- 七项OPS/DB/VECTOR/METRICS归属、触发、责任人与开始/关闭条件保留；其9月15日状态是快照，后续实际证据按Story单独记录，不能永久锁住进度或一次关闭所有消费。
- 7.2、8.7/8.8仍延期；FR40.1照片方向没有正式实施编号，不能继承旧手工7.2合同。FR42/43及其他已明确延期项不恢复。

## Epic交付边界核对

| Epic | 正式Story | 历史 / 当前目标 | GWT | 承接核对 |
| --- | ---: | --- | ---: | --- |
| 1 | 12 | 5 / 7 | 99 | 生产身份先行；导入呈现/恢复/记录/真实图文视频/纠错各有归属，历史done不代替生产实证。 |
| 2 | 15 | 2 / 13 | 201 | S2/S3/S4/S5、单一PlanningJob、可信通勤、初始校验、候选/Top-50/负荷相互承接。 |
| 3 | 5 | 0 / 5 | 108 | 迁移合同准备不丢在制事实；3.1自己触发校验，3.4再交修复，不形成反向等待。 |
| 4 | 7 | 0 / 7 | 159 | 有序主城市链和一日游child/双交通原子发布；4.6新增与4.7日期修改范围保持。 |
| 5 | 5 | 0 / 5 | 114 | 5.1最小S10/S9来源/返回先交；5.2增强；逐行覆盖、城市文件、整趟分图与分享分别关闭。 |
| 6 | 5 | 0 / 5 | 101 | 定位单次只读，无基准不造位置；餐饮确认才写，商圈不依赖定位，清单独立版本。 |
| 7 | 5 | 0 / 5 | 98 | 真实恢复、可用入口、副本、删除、反馈分步闭环；后交付实体自己补导出/清理登记。 |
| 8 | 6 | 0 / 6 | 138 | 早期安全/指标不等运营UI；逐规则/人评、路由、账本、终态告警、只读总览各守权威边界。 |

完整跨Story衔接说明见交付映射的 `integration_boundaries`。没有为本轮SP改变原Story顺序或重新审批产品方案；默认准备顺序也不冒充所有依赖关系或固定工期。

## PRD逐条追踪

表中为当前交付责任，包含跨Story消费/扩展；不意味着列出的任一Story单独关闭整个复合需求。每张Story原有Requirements/GWT和所有适用全局NFR继续生效。源行号与全文摘要指纹、反向53张Story绑定在YAML中校验。

| 需求 | PRD条目 | 当前交付Story / 延期 | 工程条件 |
| --- | --- | --- | --- |
| FR1 | [登录首屏支持手机号+短信登录；如提供第三方登录](/home/tong123/work/nomad-mvp/docs/prd.md:120) | 1.0 | 随适用Story合同 |
| FR2 | [首页顶部分段“旅行规划｜灵感库”，中部显示目的地卡片](/home/tong123/work/nomad-mvp/docs/prd.md:122) | 1.6 | 随适用Story合同 |
| FR3 | [统一输入分流](/home/tong123/work/nomad-mvp/docs/prd.md:123) | 1.6 | 随适用Story合同 |
| FR4 | [小红书入库流程](/home/tong123/work/nomad-mvp/docs/prd.md:124) | 1.7、1.9、1.10、1.11 | 随适用Story合同 |
| FR4.1 | [连锁与分店规则](/home/tong123/work/nomad-mvp/docs/prd.md:126) | 1.11 | 随适用Story合同 |
| FR4.2 | [运营手工纠错地点](/home/tong123/work/nomad-mvp/docs/prd.md:128) | 1.11 | 随适用Story合同 |
| FR5 | [灵感库](/home/tong123/work/nomad-mvp/docs/prd.md:129) | 1.8、1.11 | 随适用Story合同 |
| FR6 | [灵感库按城市提供已导入 L3、待定位 Top-5 和来源记录作为规划种子；](/home/tong123/work/nomad-mvp/docs/prd.md:130) | 1.8、1.9、1.11 | 随适用Story合同 |
| FR7 | [AI 初始规划](/home/tong123/work/nomad-mvp/docs/prd.md:133) | 2.11 | 随适用Story合同 |
| FR8 | [时间轴编辑](/home/tong123/work/nomad-mvp/docs/prd.md:134) | 3.1、3.2 | 随适用Story合同 |
| FR9 | [增量可行性校验](/home/tong123/work/nomad-mvp/docs/prd.md:135) | 2.11、3.1、3.4 | 随适用Story合同 |
| FR10 | [AI 行程细节完善](/home/tong123/work/nomad-mvp/docs/prd.md:136) | 5.1、5.2、5.3 | 随适用Story合同 |
| FR11 | [导出行程图片](/home/tong123/work/nomad-mvp/docs/prd.md:137) | 5.4、5.5 | 随适用Story合同 |
| FR12 | [设置页](/home/tong123/work/nomad-mvp/docs/prd.md:138) | 1.0、7.3、7.4、7.5、7.6 | 随适用Story合同 |
| FR13 | [观测与评测](/home/tong123/work/nomad-mvp/docs/prd.md:139) | 8.1、8.2、8.6 | 随适用Story合同 |
| FR14 | [第三方集成](/home/tong123/work/nomad-mvp/docs/prd.md:143) | 1.0、1.6、1.9、1.11、2.4、2.7、2.10、5.4、6.2、8.1、8.3 | 随适用Story合同 |
| FR15 | [登录等权展示](/home/tong123/work/nomad-mvp/docs/prd.md:145) | 1.0 | 随适用Story合同 |
| FR16 | [行为验证触发策略](/home/tong123/work/nomad-mvp/docs/prd.md:146) | 1.0 | 随适用Story合同 |
| FR17 | [统一输入分流](/home/tong123/work/nomad-mvp/docs/prd.md:147) | 1.6 | 随适用Story合同 |
| FR18 | [多条链接粘贴](/home/tong123/work/nomad-mvp/docs/prd.md:148) | 1.6 | 随适用Story合同 |
| FR18.1 | [导入记录与去重](/home/tong123/work/nomad-mvp/docs/prd.md:149) | 1.8、7.5 | 随适用Story合同 |
| FR19 | [入库进度展示](/home/tong123/work/nomad-mvp/docs/prd.md:150) | 1.6、1.7 | 随适用Story合同 |
| FR20 | [待定位 Top-5 展示](/home/tong123/work/nomad-mvp/docs/prd.md:152) | 1.8、1.11 | 随适用Story合同 |
| FR21 | [时间轴微调与全局撤销](/home/tong123/work/nomad-mvp/docs/prd.md:153) | 3.1 | 随适用Story合同 |
| FR22 | [冲突分级与后续动作](/home/tong123/work/nomad-mvp/docs/prd.md:154) | 3.1、3.4、5.1、5.4 | 随适用Story合同 |
| FR23 | [AI 填充输出规范](/home/tong123/work/nomad-mvp/docs/prd.md:155) | 5.1、5.3 | 随适用Story合同 |
| FR24 | [导出图片规格](/home/tong123/work/nomad-mvp/docs/prd.md:156) | 5.4、5.5 | 随适用Story合同 |
| FR25 | [操作可用性与恢复](/home/tong123/work/nomad-mvp/docs/prd.md:157) | 5.1、5.4、5.5、6.4、7.3 | 随适用Story合同 |
| FR26 | [规划入口](/home/tong123/work/nomad-mvp/docs/prd.md:158) | 2.3、2.7 | 随适用Story合同 |
| FR27 | [Planner Picker 路由与参数](/home/tong123/work/nomad-mvp/docs/prd.md:159) | 2.3、2.7 | 随适用Story合同 |
| FR27.1 | [规划输入流程分为 S2 `旅行时间` 与 S3 `住宿安排`。旅行时间显示整体日期和天数、每天几点出门，并允许到达/离开分别使用精](/home/tong123/work/nomad-mvp/docs/prd.md:160) | 2.3、2.4、2.5 | 随适用Story合同 |
| FR28 | [S5 `规划前确认` 在选点后展示地点意图摘要，并要求用户在 `悠闲 / 从容 / 充实` 中完成首次节奏对齐](/home/tong123/work/nomad-mvp/docs/prd.md:161) | 2.6 | 随适用Story合同 |
| FR28.1 | [玩法与兴趣信号](/home/tong123/work/nomad-mvp/docs/prd.md:162) | 1.9、2.6、2.11 | 随适用Story合同 |
| FR29 | [Picker 以 `全城检查` 为主界面，展示目标城市 L1 地图和 L2 汇总；点击 L2 进入设计状态 `选择 L3`，应用内](/home/tong123/work/nomad-mvp/docs/prd.md:163) | 2.7、2.8 | 随适用Story合同 |
| FR30 | [L3 行右侧提供互斥图标意图](/home/tong123/work/nomad-mvp/docs/prd.md:164) | 2.7 | 随适用Story合同 |
| FR31 | [Picker 所有视图共享同一意图状态。返回全城检查后，required 与 along_route 必须同时映射到 L3 缩略图](/home/tong123/work/nomad-mvp/docs/prd.md:165) | 2.7、2.8 | 随适用Story合同 |
| FR32 | [单一可见 AI 规划](/home/tong123/work/nomad-mvp/docs/prd.md:166) | 2.9、2.10、2.11 | 随适用Story合同 |
| FR32.1 | [内部快速降级](/home/tong123/work/nomad-mvp/docs/prd.md:167) | 2.9 | 随适用Story合同 |
| FR32.2 | [高质量编排](/home/tong123/work/nomad-mvp/docs/prd.md:168) | 2.9 | 随适用Story合同 |
| FR32.3 | [候选与模糊补全](/home/tong123/work/nomad-mvp/docs/prd.md:169) | 2.11、2.12、2.13、2.15、3.2 | 随适用Story合同 |
| FR33 | [规划任务可控性](/home/tong123/work/nomad-mvp/docs/prd.md:171) | 2.9、8.3、8.4 | 随适用Story合同 |
| FR34 | [AnchorPool](/home/tong123/work/nomad-mvp/docs/prd.md:174) | 2.11、2.12、2.13 | 随适用Story合同 |
| FR34.1 | [平台 AnchorPool 主动冷启动](/home/tong123/work/nomad-mvp/docs/prd.md:176) | 延期；8.7 / 8.8 | 随适用Story合同 |
| FR35 | [Linked multi-city](/home/tong123/work/nomad-mvp/docs/prd.md:178) | 4.1、4.2、4.3、4.4 | 随适用Story合同 |
| FR35.1 | [跨城一日游](/home/tong123/work/nomad-mvp/docs/prd.md:180) | 4.5、4.6、4.7 | 随适用Story合同 |
| FR36 | [酒店槽与餐饮处理](/home/tong123/work/nomad-mvp/docs/prd.md:183) | 2.5、2.11、3.3、6.1 | 随适用Story合同 |
| FR36.2 | [餐饮选择池与商圈召回](/home/tong123/work/nomad-mvp/docs/prd.md:185) | 6.1、6.2、6.3 | 随适用Story合同 |
| FR36.1 | [酒店感知的编排偏好](/home/tong123/work/nomad-mvp/docs/prd.md:187) | 2.11 | 随适用Story合同 |
| FR37 | [结果页](/home/tong123/work/nomad-mvp/docs/prd.md:193) | 5.1、5.2、5.3 | 随适用Story合同 |
| FR38 | [平台 AI 额度与成本控制策略](/home/tong123/work/nomad-mvp/docs/prd.md:196) | 1.9、1.10、2.9、3.5、5.1、5.4、6.4、8.3、8.4 | 随适用Story合同 |
| FR38.1 | [Provider 额度与不可恢复异常告警](/home/tong123/work/nomad-mvp/docs/prd.md:198) | 8.4、8.5 | 随适用Story合同 |
| FR39 | [AI 事实引用与幻觉约束](/home/tong123/work/nomad-mvp/docs/prd.md:201) | 5.1、5.2 | 随适用Story合同 |
| FR40 | [计划延续与状态](/home/tong123/work/nomad-mvp/docs/prd.md:203) | 7.1 | 随适用Story合同 |
| FR40.1 | [照片驱动的到访标记与旅行影像](/home/tong123/work/nomad-mvp/docs/prd.md:204) | 延期；尚无正式执行Story | 随适用Story合同 |
| FR41 | [酒店选择优先](/home/tong123/work/nomad-mvp/docs/prd.md:206) | 2.5、2.11、3.3 | 随适用Story合同 |
| FR42 | [酒店更改与重排确认](/home/tong123/work/nomad-mvp/docs/prd.md:208) | 延期；尚无正式执行Story | 随适用Story合同 |
| FR43 | [历史步骤管理](/home/tong123/work/nomad-mvp/docs/prd.md:210) | 延期；尚无正式执行Story | 随适用Story合同 |
| FR44-lite | [文本快速搜索](/home/tong123/work/nomad-mvp/docs/prd.md:212) | 2.5、2.15、3.2、3.3 | 随适用Story合同 |
| FR45 | [用户反馈](/home/tong123/work/nomad-mvp/docs/prd.md:220) | 7.6 | 随适用Story合同 |
| FR46 | [行程清单](/home/tong123/work/nomad-mvp/docs/prd.md:230) | 6.4、6.5 | 随适用Story合同 |
| FR47 | [商圈归属](/home/tong123/work/nomad-mvp/docs/prd.md:231) | 6.3 | 随适用Story合同 |
| FR48 | [旅中定位降级](/home/tong123/work/nomad-mvp/docs/prd.md:232) | 6.2 | 随适用Story合同 |
| FR49 | [阶段与转场](/home/tong123/work/nomad-mvp/docs/prd.md:233) | 1.6、2.3、2.5、2.6、2.7、2.9、3.1、4.1、4.5、5.1、5.4、6.1、6.4、7.1 | 随适用Story合同 |
| FR50 | [对话式局部调整](/home/tong123/work/nomad-mvp/docs/prd.md:234) | 3.5、4.4、4.7 | 随适用Story合同 |
| FR51 | [跨日负荷与天气上下文](/home/tong123/work/nomad-mvp/docs/prd.md:235) | 2.14、3.4、4.3、4.4、4.6、4.7 | 随适用Story合同 |
| NFR1 | [国内可用三方服务优先；外部依赖需有可替代方案或降级策略。](/home/tong123/work/nomad-mvp/docs/prd.md:238) | 1.0、1.9、1.11、2.4、2.10、8.3 | 随适用Story合同 |
| NFR2 | [前后端以 SSE 展示异步进度；事件使用单调 cursor 和可恢复持久记录，客户端/服务重启后从最后确认位置重连，不把内存队列当](/home/tong123/work/nomad-mvp/docs/prd.md:239) | 1.7、2.9、4.3、5.1、5.4、7.4、7.5 | METRICS-01 |
| NFR3 | [AI 安全与成本控制](/home/tong123/work/nomad-mvp/docs/prd.md:240) | 1.0、1.9、2.9、5.1、8.1、8.4 | OPS-02、METRICS-01 |
| NFR4 | [性能目标](/home/tong123/work/nomad-mvp/docs/prd.md:241) | 2.9、3.4、5.1、5.4、8.1 | METRICS-01、METRICS-02 |
| NFR5 | [质量指标](/home/tong123/work/nomad-mvp/docs/prd.md:242) | 1.11、2.11、2.14、3.4、6.1、8.2 | METRICS-01、METRICS-02、METRICS-03 |
| NFR6 | [可观测性](/home/tong123/work/nomad-mvp/docs/prd.md:243) | 1.0、1.6、2.9、8.1、8.2 | METRICS-01、METRICS-02、METRICS-03 |
| NFR7 | [合规与隐私](/home/tong123/work/nomad-mvp/docs/prd.md:244) | 1.0、2.7、7.4、7.5 | OPS-01、OPS-02 |
| NFR8 | [交互体验](/home/tong123/work/nomad-mvp/docs/prd.md:245) | 1.6、2.7、3.1、5.2、6.1、7.3 | 随适用Story合同 |
| NFR9 | [行程细节完善不得改动日期、时间与顺序；任何重排必须走独立的可预览调整流程并生成新版本。](/home/tong123/work/nomad-mvp/docs/prd.md:246) | 5.1、5.3 | 随适用Story合同 |
| NFR10 | [初始规划安全性](/home/tong123/work/nomad-mvp/docs/prd.md:247) | 2.11、3.1、3.4 | 随适用Story合同 |
| NFR11 | [Linked-trip 性能与一致性](/home/tong123/work/nomad-mvp/docs/prd.md:248) | 4.1、4.3、4.4、5.4 | 随适用Story合同 |
| NFR12 | [引用可追溯性](/home/tong123/work/nomad-mvp/docs/prd.md:249) | 1.9、1.10、1.11、2.8、5.1、5.2 | 随适用Story合同 |
| NFR13 | [采集稳定性与重试责任](/home/tong123/work/nomad-mvp/docs/prd.md:250) | 1.9、1.10 | 随适用Story合同 |
| NFR14 | [许可与合规](/home/tong123/work/nomad-mvp/docs/prd.md:251) | 1.9、1.10 | 随适用Story合同 |
| NFR15 | [反馈隐私与安全](/home/tong123/work/nomad-mvp/docs/prd.md:252) | 7.6 | 随适用Story合同 |
| NFR16 | [反馈运行环境与状态](/home/tong123/work/nomad-mvp/docs/prd.md:253) | 7.6 | 随适用Story合同 |
| NFR17 | [LLM 提供商可替换与回退](/home/tong123/work/nomad-mvp/docs/prd.md:254) | 1.9、2.9、5.1、8.3 | 随适用Story合同 |
| NFR18 | [定位隐私](/home/tong123/work/nomad-mvp/docs/prd.md:255) | 6.2 | 随适用Story合同 |
| NFR19 | [Picker 状态一致性](/home/tong123/work/nomad-mvp/docs/prd.md:256) | 2.7 | 随适用Story合同 |
| NFR20 | [导入所有权](/home/tong123/work/nomad-mvp/docs/prd.md:257) | 1.0、1.8、7.5 | DB-CHANGE-01、OPS-02 |
| NFR21 | [证据诚实性](/home/tong123/work/nomad-mvp/docs/prd.md:258) | 1.11、2.8、5.1、6.3 | 随适用Story合同 |
| NFR22 | [Trip 原子一致性](/home/tong123/work/nomad-mvp/docs/prd.md:259) | 4.3、4.4、4.6、4.7、5.4 | DB-CHANGE-01、METRICS-01 |
| NFR23 | [路线与动态事实诚实性](/home/tong123/work/nomad-mvp/docs/prd.md:260) | 1.11、2.4、2.10、2.14、3.4、6.2 | 随适用Story合同 |
| NFR24 | [运营告警可靠性与隐私](/home/tong123/work/nomad-mvp/docs/prd.md:261) | 8.5 | 随适用Story合同 |

FR9的2.11初始ValidationRun与NFR19的2.7统一意图状态，均按实际GWT确认归属；不能因Requirements标签未点名，就把责任错后移到3.4或Epic4。FR14归因和NFR7地图版权补充只落实现有源要求，不增新产品Story或改写1018组GWT。

## 主开发任务决定核对

已读取「继续 Nomad 主开发线程」（`01a09678-26d9-7c00-a780-8da933702cd2`）最新6轮，重点核对：专用审核延期、额外后台仅留地点纠错；1.0生产身份前置；备份/媒体/迁移/指标责任；5.1最小闭环；18组提示独立批准；框架代码编排、有效授权单次定位与弱提示“建议核对”。这些决定与当前源文档一致，没有用旧IR的NEEDS WORK覆盖之后的修订。

## 实际验证

- `pnpm run ci:handoff`：当前8 Epic/60 Story/8回顾/1018 GWT及唯一迁移通过。
- `node --test scripts/check-handoff.test.mjs`：**42/42通过**。保留原错误拒绝场景，并新增逐需求/归因丢失、历史done冒充生产承接、照片方向误继承、合法1.0 ready/in-progress/review/done、3.1准备选择/暂停/审计恢复、逐Story工程证据、扩围回顾和全队列完成的临时fixture。
- 三个检查脚本语法检查通过；主YAML由js-yaml（拒绝重复key）解析，另做PyYAML核验。
- PRD镜像逐字节一致；架构/UX/技术规格20个源段逐段一致；正式规划输入、60个Story正文指纹与1018组GWT未改。
- 844份起始基线文件核对通过（含本轮先行保存的7份快照/指纹）；仅CURRENT、AGENTS、project-context、Sprint元数据及两个原检查脚本共6个文件按本轮授权变化。新增交付映射/复核报告/检查模块及留档均为SP产物。
- development_status、当前授权与3.1暂停内容和复核前逐项相同；Git HEAD仍为 `7250a8a131a370698bff53538a4405c2ddb94c1c`、分支仍为 `codex/story-2-2-timeline-editing`；`git diff --check`通过。
- 全队列完成等测试只验证跟踪与交接规则，使用自动清理的临时目录；没有在真实项目创建任何新实施Story，也没有把fixture当业务/生产证明。

## 下一步与未完成实证

下一张仍是 **1.0「生产登录与多设备会话补齐」**，当前backlog。之后获准准备时，正常执行create-story并携带来源合同指纹、完整验收、对应工程条件和归因子任务；不需要为了开始1.0重跑CE/IR或修改检查器。
对应登录/地图/对象存储/Provider/恢复/指标/人评与UI实证仍由所属Story在获授权阶段完成。U-Link/U-App实际支持宿主和服务能力需在首次消费Story准备/实施中核验；本轮只补清责任，未验证外部服务、部署、采购、发消息或操作真实数据。
