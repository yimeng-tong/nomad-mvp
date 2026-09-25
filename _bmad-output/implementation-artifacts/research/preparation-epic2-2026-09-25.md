---
project: nomad-mvp
date: '2026-09-25'
scope: implementation-contract-preparation-only
stories: ['2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10', '2.11', '2.12', '2.13', '2.14', '2.15']
status: drafting
implementation_started: false
context_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
---

# Epic 2 实施合同准备研究

本记录供 2.3–2.15 的合同共享，不代表开发或真实服务验收。完整 Epic 2 源为 `_bmad-output/planning-artifacts/epics.md` 第1263–2546行；2.0/2.1历史保留，13张当前合同共198组GWT（2.9含C08）。权威指纹、条件和责任取当前 ui-foundation-2026-09-20 catalog/delivery；准备写入协议见 `research/all-preparation-protocol-2026-09-25.md`。本文件与同批Story/validation以仓库根为相对路径基准。

## 来源与取舍

读取 CURRENT、project-context、当前Sprint、catalog/delivery完整YAML并提取本Epic绑定；读取 `docs/tech-spec-epic-2.md`、源Epic全部Story以及当前架构、S2–S7 UX、原型覆盖和共享UI/导航ADR。源Story优先于概括性技术规格：2.14只实现日负荷，不因tech-spec 4.5提到连续负荷就提前实现3.4；2.13下方CE说明明确Top-50降级由2.11/2.12承担，不等待延期8.7/8.8。

已读 `.agents/skills/bmad-create-story/SKILL.md`、`discover-inputs.md`、`checklist.md`、模板和自定义解析结果（无prepend/append）；沿project-context使用中文。自查不是独立review；root负责跨组审阅与状态收口。当前1.7资源阻断及开发停止、3.1暂停保持。

## 当前工作树实查

- `apps/mobile/src/planner/PlannerScreen.tsx`：799行旧Confirm/Picker；两态pace、plan-global luggage、`hotelRows`按days建立酒店、selectedIds按Inspiration身份、本地文字推断区域、假地图文案。S2/S3/S5尚未分离，Picker直接`generatePlan`。2.3建立持久输入入口；2.5逐晚替换；2.6独占启动；2.7改canonical三态与真实共享地图，保留Home handoff来源且不从旧UI自动确认新字段。
- `apps/mobile/src/planner/api.ts`：走`createBoundJsonRequest`/`watchBoundStream`；generation幂等nonce仅在内存Map。未知结果保留nonce、明确400/403/422释放。2.3起新命令要接持久回执恢复，不能只沿用页面内Map；2.9保留真实身份绑定流，扩持久cursor，不把SSE放入Query。
- `apps/server/src/routes/library.ts`：`/library/cities`经过authGuard后调用`listLibraryCitiesForUser(req.user.id)`，是owner灵感汇总。它和`/library/inspirations`都必须私有Query命名空间；不能当公共全城目录。2.7需要真正的City/L1/L2/CanonicalPOI目录读取边界。
- `apps/mobile/src/App.tsx`：身份变更清plannerHandoff/view，后台markChecking；App/Planner/DayPlan/SlotEdit分别注册host返回。9.7负责唯一返回协调，业务新增页面消费其adapter，不能再叠加历史listener。
- `apps/mobile/src/planner/DayPlanScreen.tsx`：独立loading视图、HQ1500ms轮询/预览/采用、seed reset和day-scoped recent action。2.9只替换单任务/稳定shell；保留当前编辑数据与回执，不借2.9恢复3.1或把旧编辑15分钟语义当当前目标。2.10可投影同一服务器通勤事实，不能客户端估算。
- `apps/server/src/application.ts`实际装配Fastify插件/路由和onClose；`index.ts`是启动预检。新增路由/worker生命周期应接application与所属plugin，不能计划只改index。
- `apps/server/src/planner/{repository,prisma-repository,service}.ts`：已有owner鉴权、PlanVersion不可变写入、EditEvent/幂等/补偿undo和attempt heartbeat。恢复会DELETE旧PlanJobEventRecord再从头计序；saveQuickVersion与done分开事务。2.9必须迁为job终生单调事件及原子publication/done，保留owner资格锁、旧版本和EditEvent引用。
- `apps/server/src/planner/source.ts`：`getAnchorPool`先`ensureAnchorPoolForCity`刷新；`searchPoi`还在POI事务内刷新池；`getBuiltInFallback`会写内置清单、逐项AMap补查、可能采用首个结果。这些不是新只读池/安全共享准入。2.11先建立有界只读基础候选与Top-50消费；2.12不足才明确附近扩展；2.13集中取消读时刷新和发布不可变桶快照。
- `apps/server/src/planner/anchor-pool.ts`先全城active=false，再按全部verified POI排名写入，缺许可/关闭/事实有效期/分桶/原子快照。不能从用户导入自动生成公共候选。`built-in-pois.ts`仅厦门50个名称、版本2026-07-27；名称清单不证明已验证地点或全国支持。
- `apps/server/src/integrations/amap.ts`目前只有v3/place/text、citylimit、5秒超时、基础字段和可空distance；`routes/search.ts`统一失败文案偏酒店。2.4不能从它推导时刻表；2.8不能从基础返回伪造营业/评分；2.10路线adapter尚缺；2.12附近查询尚缺。Provider失败不能在source层吞为[]后显示未找到。
- Prisma已有User/Session/City/CanonicalPOI/L1/L2/PoiMembership/Inspiration、Plan/PlanVersion/PlanJob/HqJob/PlanJobEventRecord/PlanHotelConstraint/PlanHotelSlot/EditEvent/SlotCandidate/AnchorPoolEntry/BuiltInPoiEntry；缺PlanningDraft/StayRevision/LuggageTransitionRevision/规范PlaceIntent/新PlanningAttempt/RouteFact/DayLoadEstimate/独立PlanCandidate/Anchor快照。每张首用Story逐步引入，不一次先建整个Trip/运营平台。

## 2026-09-25官方资料核验

本轮只读公开文档，无安装、凭据读取、实际API调用或供应商选择；版本基线来自当前package/lock与批准ADR。React19.2.7、Vite8.0.16、Fastify5.12.1、Prisma5主版本、Capacitor8.5.2保持；官方当前Prisma文档可能指向v6/v7，不能据此自动升级Prisma5。准确依赖/peer在各实施T0重新核对。

| 资料 | 本Epic采用的有限结论 | 适用Story |
| --- | --- | --- |
| [高德POI 2.0](https://lbs.amap.com/api/webservice/guide/api/newpoisearch) | text/around/id能力与v3现有接口不同；v5使用region/city_limit/page_size等字段，商业信息按show_fields请求且仍可能缺失；不得只改URL沿用v3参数。选实际获准版本/权益后锁adapter | 2.3–2.5、2.7–2.8、2.12、2.15 |
| [高德路径规划2.0](https://lbs.amap.com/api/webservice/guide/api/newroute) | 步行/公交/驾车是不同路线能力；需Web服务Key与适用配额。可用出发时间参数和返回单位要按选定端点核验，计划日不能由当前返回冒充 | 2.10–2.12、2.14–2.15 |
| [IATA代码查询](https://www.iata.org/codes)、[代码核验FAQ](https://portal.iata.org/faq/articles/en_US/FAQ/How-do-I-verify-an-airline-code) | designator是有治理的数据源，可能存在受控重复；完整数据取得/许可是资源决定，不用随手regex或爬取查询结果充当registry | 2.4 |
| [PostgreSQL16行锁](https://www.postgresql.org/docs/16/explicit-locking.html)、[Prisma事务](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) | 发布事务保持短小、锁序固定，冲突需有限重试；owner/version CAS和唯一键实现业务幂等，外部API不在长期持锁事务内执行 | 全Epic，重点2.3/2.5/2.9/2.13/2.15 |
| [RHF官方仓库文档](https://github.com/react-hook-form/documentation/blob/master/src/content/faqs.mdx) | defaultValues/reset/dirty与持久业务事实分离；2.3可做最小表单试点，远端hydrate不能覆盖正在编辑的字段。网站useform页本轮读取错误，不声称全API已核验 | 2.3、2.5、2.6 |
| [Query重要默认项](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) | Nomad显式关闭自动focus/reconnect刷新和retry，由身份恢复后按资源授权刷新；只读cache不承担命令回执 | 采用9.6的UI Story |
| [Base UI Dialog](https://base-ui.com/react/components/dialog)、[Capacitor App](https://capacitorjs.com/docs/apis/app) | 模态/Portal与App生命周期能力由Nomad AppSheet/host统一适配；API存在不证明身份遮蔽、返回竞争或真机恢复已验收 | 各UI Story |

## 可独立准备但不能假关闭的资源

1. 2.4：中国flight/rail实际Provider、能力/区域/日期覆盖、registry许可/版本/更新源尚未选定。T0做对照与决定记录，真实双Provider和AMap terminal/station staging才关闭服务验收；manual/window/AI仍可独立实现。
2. 2.7/2.8/2.10/2.12/2.15：实际AMap SDK/WebService版本、域名/平台权益、路线日期语义和字段/配额需受控staging，不因已有Key/文档页认定已可用。
3. 2.11：服务器管理LLM现有adapter只是接缝；真实Provider、预算、版本化指标目标和初始约束评测保留。天气由3.4选择/真实验收；本Epic不猜天气供应商、不以季节常识构造逐日预报。
4. 2.13：代表性城市公共准入资料、许可与快照审计；向量仅有真实消费时触发DATA-VECTOR-01，否则据实际code/schema给不适用证明。无提前embedding外发。
5. 所有Story：生产PITR/RPO及隔离恢复、真实PG迁移、实际设备/最低平台与正式用户目标各自验收；已有1.0/1.7/9.1局部证据可参考而不能全局继承verified。

## 写入进度

正在逐Story编写具体Tasks、AC映射和UPDATE/NEW清单；普通文件保持draft/preparation_status=drafting。完成后追加静态完整性结果，root另作独立审阅。
