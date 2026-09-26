---
project: nomad-mvp
updated: '2026-09-27'
current_epic: 1
last_completed_story: 9-5-browser-flow-and-visual-regression-gates
current_story: 1-8-owner-import-records-and-versioned-deduplication
current_story_status: in-progress
current_story_file: _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication.md
current_story_spec: _bmad-output/planning-artifacts/epics.md
planning_status: bmad-sprint-planning-complete
execution_phase: execution
next_bmad_action: bmad-dev-story
next_bmad_checkpoint: story-1-8-url-policy-and-import-record-foundation
readiness_report: _bmad-output/planning-artifacts/implementation-readiness-sp-handoff-2026-09-15.md
prompt_strength_status: approved-applied-and-revalidated
prompt_strength_record: _bmad-output/planning-artifacts/prompt-strength-adoption-2026-09-15.md
sprint_planning_authorized: true
sprint_planning_completed: true
create_story_authorized: true
implementation_authorized: true
handoff_status: story-1-8-in-progress-after-independent-preparation
tracking_system: _bmad-output/implementation-artifacts/sprint-status.yaml
migration_manifest: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.yaml
migration_report: _bmad-output/implementation-artifacts/sprint-migration-ui-foundation-2026-09-20.md
delivery_contract: _bmad-output/implementation-artifacts/sprint-delivery-contract-ui-foundation-2026-09-20.yaml
revalidation_report: _bmad-output/planning-artifacts/implementation-readiness-ui-foundation-2026-09-20.md
paused_story: 3-1-minute-timeline-editing-and-plan-wide-undo
working_branch: codex/story-1-8-import-records
story_preparation_report: _bmad-output/implementation-artifacts/1-8-owner-import-records-and-versioned-deduplication-validation.md
resource_alignment: _bmad-output/implementation-artifacts/research/story-1-0-resource-confirmation-2026-09-19.md
input_import_progress: _bmad-output/implementation-artifacts/story-1-6-dev-progress-2026-09-19.md
authentication_progress: _bmad-output/implementation-artifacts/story-1-0-dev-progress-2026-09-19.md
authentication_measurement_progress: _bmad-output/implementation-artifacts/story-1-0-auth-measurement-progress-2026-09-26.md
scope_change: ui-foundation-2026-09-20
scope_decision: _bmad-output/planning-artifacts/ui-foundation-scope-decision-2026-09-20.md
scope_readiness_report: _bmad-output/planning-artifacts/implementation-readiness-ui-foundation-2026-09-20.md
continuous_execution_authorized: true
stop_after_story: null
stop_after_story_reason: removed-by-explicit-user-direction-2026-09-25
ui_scope_progress: _bmad-output/implementation-artifacts/ui-foundation-dev-progress-2026-09-20.md
ui_scope_handoff: _bmad-output/implementation-artifacts/ui-foundation-handoff-2026-09-20.md
last_prepared_story: 1-8-owner-import-records-and-versioned-deduplication
ui_prepared_story_status: in-progress
ui_prepared_story_file: _bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet.md
ui_story_preparation_report: _bmad-output/implementation-artifacts/9-3-shared-ui-components-and-safe-app-sheet-validation.md
execution_boundary_override: _bmad-output/implementation-artifacts/sprint-execution-resume-2026-09-25.md
execution_plan: _bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md
recovery_progress: _bmad-output/implementation-artifacts/story-1-7-dev-progress-2026-09-19.md
git_checkpoint_commit: b8b445567f60fcafd0ff2d8dcd75498659b8728d
cross_device_setup: docs/ops/cross-device-development.md
development_thread_id: 01a0d78a-3692-78b1-aee5-76268a743925
development_thread_host: local
input_telemetry_progress: _bmad-output/implementation-artifacts/story-1-6-input-telemetry-progress-2026-09-26.md
input_telemetry_acceptance: _bmad-output/implementation-artifacts/story-1-6-input-telemetry-acceptance-2026-09-26.md
recovery_ui_integration_progress: _bmad-output/implementation-artifacts/story-1-7-ui-integration-progress-2026-09-26.md
recovery_ui_integration_acceptance: _bmad-output/implementation-artifacts/story-1-7-ui-integration-acceptance-2026-09-26.md
---

# Nomad Current Handoff

## 当前继续执行（2026-09-27）

2026-09-27后续复核：`6348743`完整CI`36257939023`两job成功；下载产物HEAD匹配、隔离PG29项含媒体下载期间删除撤权、旧record升级七项、只读审计迁移checksum及目标结构守卫通过。该提交已部署到VM104独立development（九迁移无待应用），合成PNG正确字节可读、同长度篡改拒绝并清理，原staging健康且仍17 job。VM108双向跨桶读/写/列/删拒绝、证书账号不能读取S3管理员配置及多行SSH公钥注入拒绝实测通过；PVE thin pool当前约186GiB可用，不是300GiB空闲。用户提醒FRP后查明阿里云上海现行frps与`cloud.yinianyunqi.top`旧OpenList链路，但当前无在线客户端/代理；homelab客户端未定位、Nomad公网API未部署。见`evidence/story-1-8-homelab-2026-09-27/review-acceptance.json`及`docs/ops/frp-investigation-2026-09-27.md`。Story1.8仍in-progress、1.9未准备、3.1继续paused；17项旧owner认定、真实XHS、异机备份/RPO、正式API认证与双端真机仍开放。

2026-09-27最新：Story1.8仍in-progress、3.1仍paused、1.9未准备。`4b7e47c`完整CI`36254458183`两job通过，隔离PG28项含私有Asset跨owner/删除前置拦截、旧record升级七项；先前`a058c68`因三个异步测试未await而在typed lint失败，失败记录保留。VM108私有S3以`objects.yinianyunqi.top:8333`经AliDNS DNS-01公开可信证书提供内网HTTPS，不依赖入站80/443；证书自动续期、分桶凭据、签名读写/拒绝、重启和实机重启后探针均通过。VM104共享PG现用独立备份桶的加密pgBackRest全量+15分钟WAL归档，合成数据库指定时点恢复在独立私有socket实例通过（目标仅marker1，源marker1/2），原staging未迁移。旧staging17个job的版本匹配隔离副本只读审计无URL碰撞，但17个均需owner证据，禁止自动回填。development已部署`4b7e47c`、九迁移/本机健康/匿名Asset401与Node真实S3合成字节探针通过。证据`evidence/story-1-8-homelab-2026-09-27/validation.json`。对象数据/备份仍同PVE宿主，真实XHS短链及媒体采集、owner逐条认定、公开API HTTPS/正式认证、实测RPO与双端真机仍开放；不把单机PITR或合成对象当整张Story完成。

9.3本地UI验收检查点dd2a970已提交推送，T9/APP-HOST-01仍in-progress。近期计划第5步的1.0独立WL-AUTH本地切片通过完整CI36192075867；真实staging/费用/目标仍待验收。1.6规范输入事件`d02d0b0`通过CI36221667847，四ZIP/999文件与108/313源码匹配，证据见input_telemetry_acceptance；SDK/许可/归因/设备及整张1.6仍开放。1.7共享UI恢复`2719998`通过完整CI36222862831两job与五ZIP/1003文件CRC：当前App/IDB双进程22项及三引擎129场景，详见recovery_ui_integration_acceptance。1.7原生C07/生产恢复与9.1正式协议/双端实机仍开放。当前`codex/story-1-8-import-records`经源11GWT/10条件/义务独立准备，Sprint及Story为in-progress。T0完成；`4110c7e`完整CI36225948368五项加法PG约束、`40a72e3`完整CI36226573986八项事件投影通过。`a6362d3`的十三项实际受理PG探针通过，但整轮CI36227255902因旧非XHS历史job被新规则过早拒绝而失败，失败记录保留。`d82f681`已接入旧hash优先检索、受保护owner列表/详情与Home共享UI；其CI36228607706浏览器job三引擎135/135与B32/B33六项通过，但整轮因工作台九个新增场景失败，PG十六项未运行。工作树修复严格网络声明、场景卸载读取及Home重复提示；本地构建、lint、289移动测试/5原生配置、10网络策略及工作台静态构建通过，待新完整CI。旧数据审计/回填、删除、真实短链、生产密钥/PITR、真机仍开放，3.1暂停。仍由本任务唯一写入，两个原Story baseline7250a8a均不改。

最新`eb23521`的CI36229356143浏览器job再次三引擎135/135与33视觉通过，工作台40/41；唯一失败是Normal场景在详情loading时过早查找原URL，十六项PG仍未运行。工作树已将断言改为等待详情，在`/tmp`临时Chromium/共享库本地实际跑通41/41，待新完整CI。该局部浏览器成功不关闭删除、旧数据或原生/生产门槛。

当前最新已提交`c031147`完整CI36229930650两job通过，隔离PG十六项、工作台41/41与18组反例、三引擎135/135及33视觉产物逐个核对HEAD/CRC；证据见`story-1-8-dev-progress-2026-09-26.md`和`read-ui-ci-verification.json`。其后工作树只新增P2002一次新事务恢复与第十七项合成PG探针，本地server build/lint通过，待下一轮CI。1.8整张仍in-progress：删除/重提、旧库审计/回填、真实短链、生产密钥/PITR、原生/实机仍开放，不提前准备1.9，3.1继续暂停。

更新：`aed0885`完整CI36230649027两job通过，隔离PG十七项含合成23505回滚/新事务恢复；证据见`unique-conflict-ci-verification.json`。工作树现只准备T4加法生命周期结构和独立旧record升级探针，旧唯一索引与受保护URL约束保留，尚无删除API或重提语义；本地schema/build/lint通过，升级PG/十八项探针待下一轮CI。继续保持Story1.8 in-progress与3.1 paused，生产数据、备份、真实短链和原生门槛未关闭。

最新已提交`c6fd134`完整CI36231375405两job通过，主隔离PG十八项、独立旧record升级五项HEAD/CRC一致；证据`deletion-schema-ci-verification.json`。工作树现接T4服务端作废与重提局部：预检后释放旧唯一索引，owner DELETE事务栅栏job并隐藏来源，新受理沿活动键生成新record/job；OpenAPI/类型/读路径/Planner已改，PG23项与升级七项待下一CI。本地schema/build/lint和路由/Planner定向测试通过。移动删除控件、Dock缓存撤权、活跃SSE/对象生命周期、真实库审计/PITR与设备仍开放，Story1.8继续in-progress、不准备1.9，3.1仍暂停。

更新：`d55efe6`完整CI36232326277两job通过，隔离PG23项及分阶段旧record升级七项产物HEAD与提取文件SHA一致，证据`deletion-server-ci-verification.json`。工作树新增移动端二次确认删除、成功后Library/已选规划项与Dock回执/外部输入claim撤权；丢失删除响应保持未确认，owner切换遮蔽迟到回执。本地297移动用例+5原生配置、12文件typed lint、真实产品Chromium B32–B34三项及类型/构建通过，见`deletion-ui-local-validation.json`；此工作树仍待提交后完整CI三引擎。活跃SSE残帧、共享对象实际生命周期、旧库只读审计/回填、生产密钥/PITR、真实短链和原生双端仍开放，1.8维持in-progress，3.1暂停。

`0ffc3e0`已提交推送，CI36233616834的浏览器实际交互三引擎138/138通过，但固定覆盖合同尚未列B34，导致浏览器job在`NOMAD_E2E_REQUIRED_MATRIX`失败；build-and-test成功，整轮仍失败，下载产物离线复验及失败证据见`deletion-ui-first-ci-failure.json`。工作树已将B34纳入合同，并在服务端每次发送排队SSE事件/重同步控制前持有owner/job读锁复核，防止删除提交后残帧外发；隔离PG探针待新CI执行。本地server build、三文件typed lint、handoff及82项回归通过。旧库审计/回填、真实对象/PITR、短链和设备仍开放，1.8与3.1状态不变。

`a59b66b`完整CI36234249586两job通过：隔离PG25项包含删除前/后SSE写入栅栏，分阶段升级七项；下载报告HEAD/提取文件SHA一致。浏览器归档离线核验三引擎138/138及33视觉/产品源码绑定通过，见`sse-deletion-ci-verification.json`。工作树只增加两个owner共享CanonicalPOI与媒体键的合成引用反例，脚本独立TypeScript与lint通过，26项PG尚待下一CI。真实对象桶访问/物理清理、旧库只读审计/回填、生产密钥/PITR、真实短链及双端原生仍开放；1.8未done，1.9未准备，3.1暂停。

`921183a`完整CI36235012301两job通过；主隔离PG26项含跨owner共享POI/Asset行引用隔离，分阶段旧record升级七项，下载报告HEAD/提取文件SHA一致。浏览器归档离线核验三引擎138/138、33视觉与产品源码绑定，见`shared-reference-ci-verification.json`。这只证明合成PG行级引用，不证明真实对象桶ACL/引用计数/物理清理。1.8仍in-progress，生产旧库审计/回填、真实短链/采集、密钥/PITR、双端原生与运营门槛未关闭；1.9不提前准备，3.1仍暂停。

Apple/微信实际直接应用或身份平台/非密配置位置已询问；已有法律/U-Link/设备问题不重复。SDK关闭/缓存残留证据保持，未接通的许可/归因不会被测量工作关闭；没有选择新的供应商、外发短信或部署。缺项只阻断对应切片，完成当前独立工作后继续按execution_plan，不提前准备1.9。

## 当前执行交接（2026-09-25）

用户明确解除原1.7完成后停止边界，改为按近期开发顺序滚动CS/VS，并要求新建任务开发与审阅。授权记录见frontmatter.execution_boundary_override；不再全量准备backlog。

Story9.4与9.5均已完成。9.5源码85eedb6的完整CI36157432347、93项三引擎/24视觉、v2来源/构建/PNG及全部正反例通过；777个实际下载文件和12条trace核验，8项独立CR修补关闭。两项工程条件只验证9.5自身。

9.3本地共享UI切片已通过三层CR及aeadc1e完整CI36184294356：129产品/33视觉、6三引擎组件、32工作台、88 typed lint、970下载文件核验。四项UI条件与local-ui-regression已verified；T9/APP-HOST-01及整张9.3仍in-progress。详见story-9-3-acceptance-2026-09-26.md；接续execution_plan第5步在制Story集成与剩余代码。next_story_to_prepare为1.8，仅临近实施时准备，不批量准备backlog。1.0/1.6/1.7/9.1保留真实资源/关闭门槛，3.1继续paused与上游/迁移审计要求。当前67 Story/1089 GWT：9done、6in-progress（含暂停3.1）、0ready、52backlog。详细执行顺序仍见execution_plan。

9.4开始前的代码/锁文件/合同/脱敏证据基线已提交并推送（b8b4455）；WSL与Mac通过Git交接，Mac可承担组件/iOS，不强制切机。同一共享文件使用单一写入者；当前开发任务为Nomad UI基础开发与审阅（01a0d78a-3692-78b1-aee5-76268a743925），接管当前保存项目；原Nomad Sprint Planning已完成最后轮次且资源阻断，不自动重启。原30分钟heartbeat当前配置为PAUSED，不能从旧monitor JSON的ACTIVE推断正在运行。

开发测试配置集中VM104，跨设备连接与秘密边界见docs/ops/cross-device-development.md。新开发服务使用独立数据库与SSH回环入口；原生HTTPS/frp仍须实际核验，不能以私网配置替代。

## 历史交接记录（以下截止恢复决定前）

下方旧“停止/不进入1.8/只准备9.4”等句子是历史指令与观察，已由上方当前授权覆盖；它们不会解除任何真实验收缺项。具体功能完成证据仍按对应记录与当前源码核对。


## 最新准备交接（2026-09-25）

用户已明确要求准备9.4，实际合同与两份独立验证现已完成，状态ready-for-dev；文件与验证路径见frontmatter。6组GWT及当前源指纹/工程条件完整承接，工作台/MSW/lint尚未实施。下一待准备合同为9.5。主执行入口仍是资源阻断的1.7，完成后停止边界未解除，3.1仍paused；本次没有启动开发。

## 当前有效UI范围（2026-09-20）

已批准shadcn/ui＋Base UI＋Tailwind4与Nomad共享层；iOS/Safari16.4+、Firefox128+；Query9.6和Router9.7均纳入本期、分别验收。当前9 Epic/67 Story/1089 GWT/66FR/25NFR，9.4为ready-for-dev，其余新增Story仍backlog；业务、历史done及3.1暂停保持。新catalog/delivery见frontmatter，旧日期文件为历史。

9.4合同已准备，下一待准备合同是9.5，再9.3；这不改变当前1.7资源阻断与完成后停止边界。原主任务不被本次范围同步自动重启。以下9月19日切片属于历史进展，当前入口由本段/frontmatter/Sprint确定。

**当前开发边界：完成当前Story1.7后停止，不进入1.8。Story仍in-progress；独立实现与隔离证据已封存，当前因实际设备、备份目标和正式验收条件缺项进入资源阻断，不能标done。**

**持续目标资源阻断：见story-1-7-blocked-audit-2026-09-19.md；资源补齐后续接当前Story。1.0/1.6/1.7/9.1保持in-progress，3.1仍暂停。**
用户2026-09-17在准备完成后要求“继续下一条”，已授权进入当前1.0本地实现与必要隔离合成验证。
2026-09-19用户补齐三端图形、双端U-App、短信签名/模板，并授权自行复用或新建homelab VM/LXC。
已复用并启动VM104，配置预检通过；整体开发测试完成后再发布公有云。真实外发及既有数据变更仍按具体联调范围处理。

## Read in This Order

1. `AGENTS.md`、`_bmad-output/project-context.md`。
2. `_bmad-output/implementation-artifacts/sprint-status.yaml`：当前执行状态、授权记录、暂停与逐Story条件进展。
3. Sprint指向的当前ui-foundation-2026-09-20 delivery/catalog、scope_decision与定向readiness；旧9月15/17日文件保留历史。
4. 当前1.7实现合同及同名validation，核对源Epics/catalog。读取1.6的最新Story/progress作为已存在快照/回执输入，再按需读取1.0/9.1未关闭门槛。
5. `resource_alignment`指向的9月19确认记录决定当前资源与homelab状态；9月18缺项及9月17供应商候选为历史。再按需读取后端上下文、准备审阅、源PRD/架构/UX与实施前置。

CE、九项IR整改、18组呈现方案和SP已批准/复核，无需重复审批。9月15/17的SP报告保留为
历史完成快照；本文件与当前Sprint决定现时节点，不从旧聊天/旧CURRENT重新派发任务。

## Current Story 1.0

- 复用现有首屏与User/OAuthIdentity/Session，补真实身份、稳定owner、持久多设备会话、当前退出及最小桌面运营授权。
- 旧外部u_*到数据库UUID存在二次hash链；迁移需可信归属、显式冲突清单、sourceHash/旧Job/HQ恢复兼容，不能按测试手机号认领或丢弃旧数据。
- Session公开引用与cookie secret分离；全路由认证、活动SSE撤权、跨标签页/后台恢复、跨owner缓存与迟到请求进入同一安全闭环。
- 明确1.0与7.3设置重做、7.5删除清理、5.x完整fill/export边界；现存裸入口需要保护，未实现能力不伪造验收。
- login-attribution保留U-Link/U-App实际宿主与真实归因责任。Apple/微信及友盟资源、实际账号/权益/回调、生产HTTPS/备份恢复和性能目标仍须在相应实施阶段核验。
- 独立审阅要求的共享cookie多tab与bfcache/回前台场景已补入任务；预期owner/session只校验上下文一致性，不能替代真实认证。
- OPS-01已进入homelab环境预检，尚未完成备份/恢复及认证验收；DB-CHANGE-01与METRICS-03已in-progress，METRICS-01/02仍not-started（以Sprint最新记录为准）。

## Sprint Facts

- 9 Epic、67 Story、9回顾、1089 GWT；7历史done、1.0/1.6/1.7/9.1 in-progress、3.1继承in-progress且暂停、1 ready-for-dev、54 backlog。
- Epic1/2/3/9为in-progress，其余backlog；Epic1回顾done只覆盖历史1.1–1.5，扩围回顾仍需单独实证。
- `next_story_to_prepare`现为9.5；当前执行入口仍为资源阻断的1.7，完成后停止。1.0/9.1未被标done，保持对应真实门槛。
- 66FR（62MVP/4延期）、25NFR及60张当前目标保持。7.2、8.7/8.8、FR34.1/FR40.1/FR42/FR43仍延期。
- 1.11手工纠错、5.1最小S10→S9实际来源→原S10闭环、18组呈现和“已开始下载，请确认”保持。

## Paused Editing Migration

旧2.2只迁入 `3-1-minute-timeline-editing-and-plan-wide-undo`；原历史文件不独立执行。
保留 `legacy_story_id: 2-2-timeline-editing-undo-and-history`、
`baseline_commit: 10f940c49e2d61ddcb1233cffddd071ed1c9284c` 与现有Git历史。
恢复需1.0、2.7、2.9、2.10、2.11的真实合同可消费，再完成新3.1合同和keep/change/remove
审计。准备时保持继承in-progress，用contract_ready区分；3.1自己触发ValidationRun，不等3.4。

## Working Rules and Verification

WSL Ubuntu `/home/tong123/work/nomad-mvp`，使用WSL Node/pnpm。当前仍在
`codex/story-1-0-production-auth`，起始HEAD为`7250a8a131a370698bff53538a4405c2ddb94c1c`；
本轮创建新的1.0分支，旧2.2分支/历史保留；保留全部未提交规划、图片与历史代码，不reset/clean。

本轮开始前的CURRENT、project-context、Sprint和回归测试快照在
`_bmad-output/implementation-artifacts/archive/story-1-0-preparation-2026-09-17/`。
交接检查：`pnpm run ci:handoff`；回归：`node --test scripts/check-handoff.test.mjs`。
回归fixture固定到SP完成快照，另校验真实工作树，支持后续状态推进。

2026-09-19用户已授权当前MVP持续准备/开发/验证/审阅，后续Story无需再授权；9月19另获homelab开发测试资源复用/创建授权，VM104已启动。
整体开发测试完成后再处理公有云发布；费用、真实外发与既有数据操作仍按具体范围处理。文件只记录指令。
开发开始前快照在 `archive/story-1-0-dev-start-2026-09-17/`（implementation-artifacts内）。


## 当前T0进展与缺项

用户已要求继续开发。启动配置校验和fixture隔离已接入；持久认证、PNVS适配、owner兼容及新HTTP路由
已装配并通过隔离PG/HTTP、真实socket撤权与Chromium替身交互。详见`authentication_progress`；正式协议配置缺失时新登录明确不可用，不把预检/替身/Android编译视为真实登录或双端完成。
资源证据见`resource_alignment`；9月17/18预检保留历史。

云AK在`.env.aliyun-admin.local`，图形三端及U-App双端资源在`.env.story-1-0.local`；两者
0600且Git忽略，不输出值、不随应用自动加载。当前Web/PWA选`nomadh5`；短信选已批准签名
「恒创联众」和模板100001。真实配置预检已通过，不再缺签名、图形密钥或平台注册信息。

现有VM104 `nomad-staging`已启动并健康检查通过，4核/8GiB/64GiB、IP192.168.31.104；
可通过PVE192.168.31.2跳板SSH访问。当前仍运行历史release10f940c49e2d，未部署新认证。
U-App两端Key不证明纯Web/PWA的统计/归因已接通；「暂停使用」文案可能是按钮，状态未核实。
测试域名、HTTPS/frp及真实短信/图形验票仍需实际联调，原资源缺项暂停已解除。

1.0 T0/T4执行9月18供应商决定；源GWT/SP指纹及安全/归因/工程责任保留。没有为旧候选购买资源，
同日存档中的OSS/视频不自动扩围；App已由本次CC正式批准并由Epic9/相关业务Story承接。继续1.0 T0运行模式与宿主接入工作；
不再重复索取已补齐资源，按新版队列推进独立工作；3.1仅在真实上游和迁移条件满足后恢复。

## Capacitor范围交接历史（2026-09-19；现行UI范围见2026-09-20记录）

保留Web/PWA，首期Android APK与iOS TestFlight；9.1前置安装/宿主，原业务Story消费原生能力，9.2最终分发。完整范围及持续授权见capacitor-scope-decision-2026-09-19.md。

持续授权见`scope_decision`。当前恢复主入口指向1.6独立实施；1.0真实验收继续保留，9.1已由App任务交接主任务负责，详见Sprint的active_workstreams；不是两个任务分别重写同一认证实现。文档/guard同步和定向就绪检查已通过；9.1已完成可推进的本地宿主、双端工程同步与Android调试APK，实际资源/设备门槛见其dev-progress。只有真实App证据满足才关闭1.0/9.1；可并行共享后端继续。新9.2最终分发不作为早期业务循环前置。

9.1最新实现/构建证据：`_bmad-output/implementation-artifacts/story-9-1-dev-progress-2026-09-19.md`。30分钟跟进为Codex heartbeat `nomad-app`，正式交接见`_bmad-output/implementation-artifacts/capacitor-main-task-handoff-2026-09-19.md`。主任务按已授权的持续BMAD流程推进，缺硬资源只阻断对应验收，不重复请求常规授权。


## 持续目标与下一独立开发入口（2026-09-19）

已读取App任务的实际用户指令和正式交接，并创建本任务持续目标（active，无指定token预算）。用户要求按新版BMAD继续后续Story，普通准备/开发/review不再逐项授权；不能因局部成功停止等待“继续”。当前1.0和9.1仍in-progress，真实协议/供应商/归因/双端门槛只阻断对应验收，3.1保持paused。

Story1.6已完整准备，文件`_bmad-output/implementation-artifacts/1-6-home-multi-link-import-queue-and-honest-status.md`，11组GWT/source hash与9月19catalog一致，含input-attribution及6项工程条件，两份独立准备复核已落实。Sprint标in-progress，next_story_to_prepare为1.7。下一执行动作为读取1.6及validation并按bmad-dev-story实施其本地/隔离切片；主恢复入口现为1.6 in-progress，实施时同步in-progress；1.0保持未关闭，不因切入独立Story标done。

1.0最新源码已补最小桌面/ops权限、原生完整通道、安全存储/遮蔽/取消/回执恢复，实际PG/HTTP及真实socket撤权、Chrome替身交互通过；原生Android已在主任务最新修补后重新同步编译通过（213 tasks，13s），旧APK SHA只代表其当时源码。iOS尚无Mac构建/设备实证。法律正文/URL问题由本任务已提出；Mac/签名/双端设备问题由App任务已提出，不重复索取密钥。


1.6当前执行点：journal/controller/inbox已接通：prepare后派发、同owner重启先GET原回执、明确继续同operation、跨owner隔离、完整10秒后记录展示。192移动测试+3配置、18ingest/8合同、日志核心22项、实际Chromium两进程App+真实IDB+明确鉴权/API/深链替身通过；无重复POST、重放抑制、owner变化均实测。7项限定审阅/集成问题已修补，含多来源/解析期间编辑、未识别来源不能claim、过期容量、旧Chromium scheme兼容及429不确定性。**下一段继续T6真实归因代码/资源核对与T7测量，不重做日志接线。** 读取story-1-6-dev-progress-2026-09-19.md最新追加、local-validation及docs/ops/input-operation-journal.md。真实法律/认证/归因/iOS及双端设备/真实基线和生产恢复门槛保持；1.0/9.1/1.6未关闭，3.1暂停，真实新导入仍等待适配器Story。


1.6 T7本地测量切片已落地：`docs/ops/import-measurements.md`及`evidence/story-1-6-measurement-2026-09-19/`保留矩阵、单请求修复前后和截止负例。受理后首流改为立即建立，测量/连接异常不能改业务事实。限定三层审阅7项和跨场景冲突残项已关闭；METRICS-01仅in-progress，真实基线/目标/成本均未关闭。**下一执行点为版本化归因/隐私字典与实际U-App/U-Link宿主接入核对**，已有Noop/key黑名单不能冒充完成；本任务已问U-Link域名/Scheme或配置路径，等待回复时继续独立代码。不重复实现日志/本地报告，不重问法律正文、Mac/签名/设备问题。


当前共享首用遥测字典/许可核心已实现并完成三层7项修补，217移动+3配置、21核心反例及真实浏览器3个明确HTTP替身信封通过；隐私值级规则已接现有页面出口。**下一执行点为固定版友盟原生SDK/实际适配器与App许可和规范事件接线**。先读`docs/ops/telemetry-first-use-v1.md`及Story1.6进度最新段；不要再次重写字典/运行时。runtime目前仅通过隔离测试，App默认Noop、U-Link/真实查询、许可UI、匿名关联和清理尚未完成。U-Link域名/Scheme与法律/设备问题已提出未答，继续独立代码，不把未连接当验收完成。最新Android243tasks/11s构建/签名及源码指纹见telemetry validation/local-validation，iOS无设备/编译新证据。


最新原生SDK核验：四份官方制品已锁定并静态核验；真实Android离线SDK探针已执行（36tasks构建/双IP族出站隔离），关闭组合10秒后仍有SDK db/envelope/identity文件。证据`docs/ops/umeng-sdk-artifact-audit.md`和`evidence/story-1-6-umeng-sdk-2026-09-19/{artifact-audit,android-lifecycle}.json`。因此不能把调用disable当同步清理成功，实际SDK适配器/法律策略/iOS运行仍待落实；主App没有接入真实SDK。模拟器文件仅.local-tools，ADB仅操作emulator-5566，探针force-stop且模拟器已请求关机；再使用前核实实际状态，不从这段文字推断进程还活着。

**下一独立行动改为bmad-create-story准备Sprint.next_story_to_prepare=1.7**，继续消化现有1.6快照/回执/恢复缺口；先读当前catalog/delivery和源1.7合同，不复制旧Story，也不恢复3.1。此为已批准持续执行下的独立推进；1.0/1.6/9.1保持in-progress，SDK真实关闭/归因和所有原生/法律条件未豁免。SDK生命周期后续可按实际法律/供应商证据明确逻辑scope与底层缓冲边界，不能补空close作成功。


1.7合同现已完成：11组GWT和source SHA逐字/指纹核对、6条件、NFR20、真实worker重启与跨端cursor责任完整；两份独立准备复核的恢复实例隔离、跨标签页checkpoint CAS与客户端有界消费队列已纳入T3/T5/T7/T8。当前ready-for-dev，next_story_to_prepare推进1.8；**立即按bmad-dev-story实施1.7 T0/T1**，无需新的常规授权。别把本段准备当已实现durable log/lease。1.0/1.6/9.1保持in-progress，3.1paused。


1.7现为in-progress：cursor/新事件schema、canonical诊断、受理/retry/阶段/结果的不可变事务日志已实现；真实PG迁移/固定checkpoint恢复、core8与生产者18项及27本地ingest/217移动+3配置/完整build通过，限定三层审阅与补证完成。当前入口是T3/T4/T5：**worker持久claim/lease/fence/checkpoint与恢复隔离→DB回放/typed恢复控制→客户端每job durable ACK**。pipeline仍旧Set/queueMicrotask，新恢复路由/持久SSE尚未接线，不能误标完成。读取story-1-7-dev-progress-2026-09-19.md最新段与local-validation，继续同一开发；next-preparation仍1.8，1.0/1.6/9.1及3.1原门槛保持。


1.7租约核心已实现并通过12项真实PG、旧event core8/producer18、29本地ingest/tsc/完整build；3项并发修复和2组补证限定审阅关闭。见`evidence/story-1-7-lease-2026-09-19/`及最新local-validation。**下一步为持久pending受理事务→调度/阶段checkpoint恢复→DB回放和客户端ACK**。目前尚无worker生命周期接线，配置enabled不能冒充恢复服务已可用；1.7保持in-progress。


1.7恢复HTTP/有界PG分页也已接入：10项真实PG（含真实Session鉴权的Fastify注入）、29本地ingest/typegen/tsc/build通过，1项OpenAPI header审阅遗漏已补。`event-replay.ts`可读连续历史并返回resync/complete，但**现有SSE尚未消费它，客户端durable ACK也未接入**。读取最新local-validation及`evidence/story-1-7-replay-2026-09-19/`；下一继续pending/worker/checkpoint与持久SSE/ACK，不把新增GET当恢复全链路完成。


1.7持久worker/checkpoint现已接入，PG16项含4处真实SIGKILL、managed retry、超时与未知外发跨配置、实际Fastify隔离/停止和完整app断DB前释放验证通过；旧lease12/core8/producer18/recovery10回归、35 ingest+53 auth/完整build通过。下一继续**持久SSE回放/tail/背压/heartbeat→每job客户端落盘ACK与真实恢复矩阵**，另保留活跃checkpoint恢复库/生产PITR及native门槛。参见最新progress/local-validation与`evidence/story-1-7-worker-2026-09-19/`。当前1.7未完成，用户已要求本Story完成后停止；不准备或执行1.8。


1.7 **T4服务端持久SSE已完成**：raw背压/逐帧鉴权/独立heartbeat、DB回放tail及原cursor恢复；两项初始化关闭/终态发送竞态修复并通过三层复核。PG16.15下12项真实socket检查（两进程、SIGKILL、慢TCP、隔离DB中断、idle/回放heartbeat、撤权和close竞态）通过；91本地测试、全build及authHTTP27/worker16/lease12/core8/producer18/recovery10回归通过。证据`evidence/story-1-7-sse-2026-09-19/`及最新local-validation。

当前入口为**T5/T6：客户端每job加密checkpoint、跨标签页单调CAS、先落盘后ACK的异步有界消费、resync/complete及FIFO恢复**。客户端尚未消费新协议，不能把服务器通过当全链路完成；另保留活跃checkpoint恢复库、正式测量与双端实际门槛。用户要求1.7完成后停止，不能派发1.8。

用户另要求排查VM104真实重启，现已确认是自动升级/needrestart（06:33–06:37 UTC），PG升至16.15；现有服务健康，未修改升级策略。只读证据/报告`investigations/vm104-postgres-restart-2026-09-19-investigation.md`已完成；probe补维护预检与外层期限。不再将旧16.14报告当当前运行版本，也不重复排查已确认的维护事件。


## 最新执行入口：Story1.7真实资源验收（覆盖上文历史切片）

客户端durable ACK已实现并完成限定审阅/真实PG浏览器验证；活动checkpoint实际恢复库也已验证。详见`story-1-7-client-validation-2026-09-19.md`、progress最新段及local-validation；不要重新派发已经完成的T0–T4或重做客户端。

当前证据：核心IDB14、实际App/PG/SSE6、压力/双窗口3项重复3轮、恢复库4项与源库不变；242移动+3配置、完整build、typegen、双端sync、Android243tasks/14s及APK Web assets匹配。真实账号/Provider、iOS构建及双端设备不因这些结果通过。

剩余必要门槛：双端实机C07及可用Mac/Xcode/签名，生产备份/PITR/RPO/最新删除抑制，真实staging指标基线和用户版本化目标/费用。只读资源问题先前已发，已知key不再索取；缺项只阻断相应验收，不伪造Story done。1.7保持in-progress，用户要求完成本Story后停止，**不进入1.8**。


补充：已完成独立私有PG实例physical base+WAL指定时点恢复6项、备份工具7项本地测试与未安装daily模板。三层审阅修补关闭；共享PG仍archive_mode=off、未再重启。证据在story-1-7-pitr-validation-2026-09-19.md；生产运行/异机存储/RPO、完整应用恢复及实机资源门槛继续保留。


当前又补齐VM104受控服务补读基线12样本与探针6个失败/清理反例，见story-1-7-server-baseline-2026-09-19.md。只作为本Story基础基线，真实产品负载、正式目标及硬件门槛不被替代。独立备份存储路径/资源名问题已发，待用户回复；不重复索取已有凭据，不进入1.8。


## 当前阻断审计

最近三轮相同资源/目标缺项持续存在；本轮重新核对当前合同、源码指纹和实际设备清单后，没有可独立完成的剩余项。持续目标标blocked，Story状态保持in-progress。详见`_bmad-output/implementation-artifacts/story-1-7-blocked-audit-2026-09-19.md`；等待既有资源问题的回复，不重复执行已通过的矩阵，不进入1.8。
