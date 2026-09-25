---
project: nomad-mvp
date: 2026-09-07
workflow: bmad-create-epics-and-stories-step-3
status: planning-completion-confirmed
approvedStories: ['7.1', '7.3', '7.4', '7.5', '7.6']
deferredStories: ['7.2']
approvedStoryCount: 5
gwtScenarioCount: 98
approvedPrototypeCount: 9
readyForEpicCompletionReview: false
epicCompletionConfirmed: true
completionConfirmedDate: 2026-09-07
nextEpic: 8
nextEpicEntryAuthorized: true
---

# Epic 7 Planning Coverage

用户已逐张批准当前五张 Story。2026-09-07 的「认可7.6」包含 Entry R1 / Recovery R2
及修订后的 20 条 GWT。用户随后于同日明确确认「Epic 7 规划完成，进入 Epic 8 拆分」。
本报告核对规划覆盖、批注落地和依赖；不是代码验收、最终 CE validation 或 Implementation Readiness。

## Approved Stories

| Story | 用户可见交付 | GWT 场景 | 当前原型 |
| --- | --- | --- | --- |
| 7.1 最近行程与继续使用 | owner 最近列表、当前版本和真实草稿/任务恢复 | 22 | Recent Trips Resume/Recovery R1 |
| 7.3 设置页账号与可用操作 | 账号、已部署操作及当前会话退出；无额度/BYOK UI | 14 | Account Actions R2 |
| 7.4 账号数据副本导出 | 当前结构化数据、一致快照、真实受保护下载 | 20 | Account Export Core/Recovery R1 |
| 7.5 账号删除与清理结果 | 不可撤销受理、全设备停用、可恢复清理及真实结果 | 22 | Account Delete Core/Recovery R1 |
| 7.6 反馈入口与可靠提交 | 实际外部入口、私有极简表单、真实回执及维护读取 | 20 | Feedback Entry R1 / Recovery R2 |
| 合计 | 五张有效 Story，均已追加 epics.md | 98 | 九张批准原型 |

Story 7.2 保留延期编号，不追加手动打卡执行合同、不标 done、不作为其他 Story 前置条件。
FR40.1 照片标记/相册视频/九宫格/AI 美化另行设计。未因本次收口批准相册扫描或轨迹存储。

## Requirements Coverage

| Requirement slice | 归属与判定 |
| --- | --- |
| FR40 最近行程 | 7.1；每个 Plan/Trip 一项，读取真实服务端状态，恢复不新建任务或扣费 |
| FR40.1 / AR16 | 明确延期，旧 7.2 原型仅历史探索，不是当前 MVP 缺口 |
| FR12 设置与数据操作 | 7.3 提供真实入口；7.4、7.5、7.6 各自完成后端/恢复/验证闭环 |
| FR25 / FR38 | 7.3 不展示额度；原功能的实际进度、后台计量/限流/降级保留，运营策略归 Epic 8 |
| FR45 / NFR15-NFR16 | 7.6 区分宿主/打开/提交，单截图、诊断 OFF、真回执、安静忙碌态、有界恢复 |
| FR18.1 / NFR20 | 7.4 导出不泄露共享 owner；7.5 处理全历史所有权/共享引用；7.6 补自己的数据生命周期 |
| FR37 / FR49 | 7.1/7.3/7.6 消费既有视图和返回上下文，不重建 ResultSheet 或重启业务任务 |
| NFR2 / AR6 | 7.1 恢复已有任务；7.4/7.5 持久任务、重启与回执；7.6 原申请有界核实，不盲目重发 |
| NFR3 / NFR7 / AR11-AR13 | 私有对象、身份/资格、日志脱敏、数据导出和删除；退出/删除/反馈各有最小权限 |
| NFR22 | 7.4 读取确定的联程版本集合；不改变 Plan/Trip 发布或编辑语义 |
| NFR8 / AR17 / UX-DR2-3 | 各 Story 定义小屏、44pt、图标名称、焦点、键盘、非颜色状态和 reduced-motion 验证 |
| UX-DR1/4/18/29/30 | 7.1 复用既有 Home/行程入口和恢复；不把已生成等同旅行结束、细节完成或无冲突 |
| UX-DR31-33 | 7.3-7.6 设置/隐私/反馈、异常恢复、真实可用操作；无用户额度或新客服后台 |
| AR1-5 / AR9 / AR14-15 / AR18-20 | 在既有系统中完整交付各功能，契约/真实服务/截图测试随 Story 验收；本轮不改变执行顺序 |
| AR22 / FR38.1 / NFR24 | AI/AMap 不可恢复错误 Telegram 运营告警归 Epic 8，非反馈转发，未被本次延期 |

结论：在当前已批准/明确延期的 Epic 7 边界内，未发现未分配的 MVP 需求。
覆盖并不表示全项目无冲突；Epic 8 和最终跨 Epic 验证仍未完成。

## Cross-Story Boundaries

1. 7.1 仅恢复实际存在的输入/任务/当前行程。新增城市或改跨城日期/交通等保留原行程；
   只有真实保存的修改产生附属入口。半途离开是「有未完成的修改」，不是失败。
2. 7.3 可先交付账号和当时已部署的操作，不依赖未来 7.4-7.6 表/worker 存在；
   每个后续 Story 同步开放自己的入口并提供完整生命周期，不创建纯数据库前置 Story。
3. 当前会话退出不等于账号删除。7.5 删除受理后停止所有设备/后台任务的访问和迟到写入；
   受限删除回执只用于清理恢复，不能下载账号数据、新建反馈或使账号复活。
4. 7.4 导出当前结构化 owned data，不是全库备份，也不含所有历史或原始媒体。
   7.5 删除覆盖本人全部历史与对象，不能把较窄的导出范围当作删除清单。
5. 7.6 实现时将新增反馈/附件索引接入既有导出注册表，将报告、截图和临时文件接入清理。
   7.4/7.5 不前向依赖不存在的 feedback 表；后续数据所有者负责扩展注册表和集成测试。
6. 账号数据 JSON-in-ZIP 与 Epic 5 行程长图下载是不同产品，后者无 ZIP 边界不变。
7. 单张主动选择的反馈截图不属于延期的旅行相册处理。不得借此扫描相册、推断打卡或调用模型。
8. 7.6 第一方落库和授权维护读取即可闭环，不依赖未来 Epic 8 后台或邮件/Telegram 转发。

## Annotation And Source Audit

- 7.6 AC 8/12/19/20 与 Recovery R2 已收纳两条最新批注：上传不可用只置灰；
  不显示截图失败/独立重试行/专用文字提交按钮。已有截图保留 X，不静默丢图。
- 上传、提交及有界回执核实中没有底部按钮；顶部/系统返回保留上下文。
  仅真实失败或等待耗尽后退出忙碌并开放恢复，不能以简化 UI 为由无限转圈。
- FR45、NFR15/16、UX、架构与 BMAD 镜像已同步，修正旧全宿主 WebView/匿名保证、
  mailto/页面打开即成功等不完整表述。外部帖子不被误算为第一方导出/删除数据。
- PRD 的旧 `Accessibility: None` 与已批准 AR17 不一致，已恢复现行最小无障碍基线；
  这是文档修正，不表示界面已达标。7.1 两份 prompt 的旧 proposed 元数据已纠正为批准。
- 7.6 旧 Recovery R1、7.3 用量 R1 继续保留为 superseded；7.2 原型仍 deferred。
  历史报告/实现 Story/原型图片未重写来冒充当前能力。

## Implementation Gates

- 7.5 是本 Epic 风险最高的交付：需要真实身份、账号生命周期隔离、可靠任务及全存储清单。
  现有开发 header/固定手机号或 OTP stub 不能作为生产安全证据；该修正已归其合同。
- 7.4-7.6 需要真实 PostgreSQL/COS、角色/owner 校验、重复/未知结果、重启与删除竞态测试。
  7.6 真实产品配置和宿主仍需实施核验，本轮未读取密钥或假定产品已经可用。
- 备份/回执/临时文件实际 TTL、图像字节/像素及等待上限须由真实部署策略和测试确定；
  不能从示意图臆造固定保留天数，也不能用队列受理代替清理或提交成功。
- 原型注册表中的 auth、长列表、timeout、receipt、retention 等边界仍须实现截图和测试；
  九张已批准板图不代表所有设备/状态已完成视觉验收。
- 全部 Epic 定义完成后才运行最终 CE validation、Implementation Readiness 和 Sprint Planning。
  若真实核验发现额外产品范围/新前置能力，应重新对齐，不把未定义的能力藏进实现。

## Verification Performed

- `git diff --check` 和 `node scripts/check-handoff.mjs` 通过。
- Node/YAML 断言通过：五张 Story 的 Requirements 与逐行 GWT 和批准评审稿一致，
  22 + 14 + 20 + 22 + 20 = 98；批准标志、延期编号和整体待确认状态一致。
- PRD 镜像完全一致；UX 四个、architecture 十四个、supporting tech specs 两个来源
  与汇编包逐字一致。FR45、FR40.1、NFR15/16 在 PRD 和 Epic 需求清单中一致。
- 九张当前 PNG 签名/尺寸、文件引用和批准元数据通过；旧原型仍为 superseded/deferred。
  未生成或改写原型图片，本检查不代替实际 UI 截图验收。
- `git diff --exit-code -- apps packages docs/api/openapi.yaml _bmad-output/implementation-artifacts/sprint-status.yaml`
  通过。本轮为文档收口，未运行 build、业务测试或真实服务端到端测试，不宣称已实现交付。

## Workflow Position

用户已确认 Epic 7 整体规划收口并转入 Epic 8 拆分，不重复要求批准 7.6 或 Epic 7。
CURRENT.md 的 `next_bmad_checkpoint` 指向 Epic 8 拆分评审；提案见
`epic-8-story-breakdown-proposal-2026-09-07.md`，其拆分本身尚未批准。
CE 仍在 Step 3，历史 sprint YAML 不变；
旧 Story 2.2 继续暂停，不新建实现 Story、不修改业务/API/Prisma。
