---
project: nomad-mvp
date: 2026-09-15
status: passed-targeted-revalidation
assessmentType: approved-ir-resolution-revalidation
baseAssessment: implementation-readiness-report-2026-09-14.md
resolutionRecord: ir-resolution-decisions-2026-09-15.md
readinessVerdict: READY
readinessScope: sprint-planning
fileSelectionConfirmed: true
openFindings: []
closedFindings: ['IR-01', 'IR-02', 'IR-03', 'IR-04', 'IR-05', 'IR-06', 'IR-07', 'IR-08', 'IR-09']
storyCount: 60
historicalStoryCount: 7
currentTargetStoryCount: 53
gwtScenarioCount: 1018
frInventoryCount: 65
mvpFrCount: 61
deferredFrCount: 4
nfrCount: 24
productionReady: false
sprintPlanningStarted: false
implementationAuthorized: false
subsequentPresentationApproval: prompt-strength-adoption-2026-09-15.md
currentHandoffReadiness: implementation-readiness-sp-handoff-2026-09-15.md
---

# IR定向复验：可以进入Sprint Planning

**九项IR问题在规划层已关闭，复验通过，可进入SP。** 2026-09-14的六步IR报告仍保留当时的
NEEDS WORK结论；本报告依据2026-09-15用户明确决定，对新增/修订合同与全部源包做定向复验。
没有把旧报告改成当时已经通过，也没有声称生产认证、纠错界面、备份或模型效果已经实现。

## 用户决定

- 专用内容审核服务延期，删除本期必须接入腾讯审核的承诺；保留原有文件/结构/权限/来源等
  防护，登录所需腾讯行为验证不在此延期内。来源平台已有审核是用户范围取舍的理由，不是
  Nomad实际执行过审核的证明，也不扩展支持来源。
- IR-03额外运营工具只保留手工纠错地点；既有品牌规则及8.3–8.6能力保留，其他工具延期。
- 九项IR详细建议的其他处理方向获认可；另一个18组提示弱化提案仍未批准。

## 逐项关闭依据

| IR项 | 已完成的规划修正 | 复验结果 | 实施时仍须验证 |
| --- | --- | --- | --- |
| IR-01 | FR1/账号范围明确合并/自助解绑/设备中心延期，多设备并存与当前会话退出由1.0落实。 | 关闭：没有未定义账号管理扩项。 | 真实身份绑定、旧owner迁移与会话行为。 |
| IR-02 | 删除必接专用腾讯内容审核的本期承诺，并同步入库/延期/架构；文件与身份校验仍保留。 | 关闭：明确延期而不是遗漏审核Story。 | 既有文件/媒体/结构/来源防护，不伪造审核通过。 |
| IR-03 | 新FR4.2映射1.11，新增7组GWT：手工名称/地址/同城坐标、来源/版本/确认/回执/撤销；原品牌规则保留。 | 关闭：最小桌面Web闭环与边界完整，无新通用后台。 | 真实权限、坐标规范化、发布竞争、缓存和旧快照保护。 |
| IR-04 | OPS-01/02、DB-CHANGE-01、DATA-VECTOR-01定义责任、触发/顺序、目标和证据，保留原备份/转层意图。 | 关闭：工程责任已有SP承接条件。 | 实际备份/PITR/新实例恢复、180天转层、每次迁移恢复；向量只在触发时验证。 |
| IR-05 | 地图可达圈/拍照热度层明确延期，当前地图与候选确认/已批准布局保持。 | 关闭：无主新图层与旧主流程Hero承诺已清理。 | 现有地图/卡片与候选落位交付。 |
| IR-06 | 新增前置Story1.0，14组GWT独立交付真实登录/身份/多设备会话及最小运营授权，历史1.1–1.5不变。 | 关闭：生产认证补齐已有明确执行归属。 | 真服务、重启/多实例、撤权、历史迁移与越权测试，测试身份隔离。 |
| IR-07 | 同步平台、现有框架/Prisma、旧Story分工、FR库存、方向例外、结果页及采集器/Nomad任务责任。 | 关闭：当前源/镜像同义；发现的“两方向”组件摘要已修正并复查。 | 后续代码仍需按新目标实施，历史附录不复活。 |
| IR-08 | METRICS-01/02/03定义早期基线、固定workload/版本/阶段、失败分母、P50/P95、8.1定版和8.2逐规则人评。 | 关闭：测量和决定时点具体，不等完整运营UI才开始采集。 | 授权staging样本、真实体验/费用目标及发布前同口径结果。 |
| IR-09 | 5.1新增2组到24，先交付最小S10宿主页/S9来源及返回；5.2保持23，在同路由增强。 | 关闭：5.1不再等待5.2才有正常入口/返回/基本来源查看。 | 5.2未交付时实际走通S7→S10→S9→原S10、来源ACL/失败与版本恢复。 |

## 独立复核与修正

三份独立报告均通过，当前没有未关闭规划发现：

- [批准输入/范围复核](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/review-approved-inputs.md)。
- [工程责任/文档漂移复核](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/review-ownership-and-drift.md)：OD-01组件“两方向”摘要已修正。
- [地点纠错/细节页面复核](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/review-poi-and-detail-boundaries.md)：PD-01坐标系合同已补齐，输入/输出坐标系、来源、转换版本和未知系拒绝在数据/API/测试一致。

## 结构、覆盖与历史保护

- 60张Story = 7张历史 + 53张当前目标；995→1018组GWT，Given/When/Then各1018。
- 只新增1.0（14组）；修改既有1.11（15→22）、5.1（22→24）、5.2（保持23）。其余56张
  既有Story正文不变。修订文件保持BMAD格式，前台说明使用中文验收文字。
- 65个FR = 61个MVP + 原4个明确延期；新增FR4.2有PRD定义、FR表与1.11验收。24个NFR保持，
  NFR13只明确采集器内部与Nomad任务责任。所有FR/NFR库存按PRD完整同步，不再漏一日游/候选语义。
- 1.0复用的是历史1.1/1.2已存在基线，不构成未来依赖。1.11依赖前序真实身份，不等8.6。
  5.1最小宿主页/来源/返回不等5.2；早期OPS/指标准备不等8.x完整UI。
- PRD字节镜像、架构14个Source、UX4个Source与技术规格2个Source逐段一致。
- 业务代码、API、Prisma、部署配置、全部旧实施Story、旧Sprint、既有PNG均未由本轮改变。
  implementation-artifacts仅更新deferred-work规划登记；脚本只适配新的handoff状态。

## SP必须承接的事项

1. 新1.0排在1.6等真实用户能力及首个运营写入口之前，历史1.1–1.5/2.0/2.1完成状态保留。
2. 旧2.2→3.1只有一个迁移执行身份，保留legacy_story_id、原baseline_commit与分支/Git历史。
3. 将[七项实施条件](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md)
   放入所属任务；角色可以由当前执行者承担，不增加团队/平台/审批要求。明确哪些是Story开始前、
   关闭前或生产开放前的证据，不能把规划已定义标为已执行。
4. 1.11纠错桌面状态、1.0真实登录状态以及5.1最小页面连贯路径的原型/浏览器证据仍按各自
   既有UI检查点处理；本轮没有生成或重画PNG，不宣称旧图覆盖新能力。
5. 新实现不恢复专用审核、额外后台、账号合并/解绑、新地图图层或未批准的18组弱提示提案。

## 验证边界

本报告的READY仅表示可进入Sprint Planning。真实资源/服务/费用/数据操作在获授权实施阶段
进行；没有运行真实登录、模型、AMap、Telegram、备份恢复或浏览器保存测试，没有部署或采购。
本轮通过的检查是结构/语义/范围、独立复核、镜像/差异与handoff，不是生产运行成绩。

## 本次输入指纹

| 输入 | SHA-256 |
| --- | --- |
| `_bmad-output/planning-artifacts/prd.md` | `40a27ed86d3c1126cd7c912b46bd8b5da860ffb0d0b34b06111c2d771f2791d9` |
| `_bmad-output/planning-artifacts/architecture.md` | `8cfc64d8478b8221d73184a812effdec86542cd08264a71c4630dd4612d39d07` |
| `_bmad-output/planning-artifacts/epics.md` | `96beb19a0a8760607fd9474555b5e6f9ca944eeae91d0bfade90b064a7b95175` |
| `_bmad-output/planning-artifacts/ux.md` | `20a59ace5d3b4e1c743df5fffc284c5410fe05afb318640a3049787a0d920b5d` |
| `_bmad-output/planning-artifacts/supporting-tech-specs.md` | `0c12085c9d1f8816c9c18d32109de5aff744cf96695c79f1d624c0b9a98ccb91` |
| `_bmad-output/planning-artifacts/implementation-prerequisites-2026-09-15.md` | `85bce48093213f88c9408f538ec9fd268dd57ceeb73525c6c8d7be009c46bbb7` |
| `_bmad-output/planning-artifacts/ir-resolution-decisions-2026-09-15.md` | `00540199fce372d19582defa3990ddf497f8159a3627fa28acf2dedfcd5762ec` |
