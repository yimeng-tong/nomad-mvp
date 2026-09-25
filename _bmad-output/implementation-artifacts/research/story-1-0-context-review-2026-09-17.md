---
title: Story 1.0 独立上下文准备质量校验
date: '2026-09-17'
story_key: 1-0-production-login-and-multi-device-sessions
workflow: bmad-create-story
review_role: independent-fresh-context-validator
status: preparation-pass-after-correction
reviewed_story: _bmad-output/implementation-artifacts/1-0-production-login-and-multi-device-sessions.md
reviewed_content_sha256: 9ed22c2ca0f937bfda871ba0de67197661d2c21914578bd65f838e87494a7820
source_contract_sha256: 2a14175e1ae81320011b5e6ccfccf75f41ee03783acef3ba15839d5502488573
open_p1_findings: 0
open_p2_findings: 0
resolved_p2_findings: 1
implementation_verified: false
real_service_evidence_verified: false
---

# Story 1.0 独立准备质量校验

结论：**修正后一致，实施准备可通过；没有未解决的 P1/P2 准备阻断。** 本结论只评价当前实施合同能否指导开发，不代表业务实现、真实第三方、迁移、浏览器或生产开放已经通过。审查中发现一项跨标签页账号切换的具体 P2 缺口，主代理已补入合同，独立复核结果如下。

本代理按 `AGENTS.md`、`bmad-create-story/SKILL.md` 与 `checklist.md` 独立审查，只新增本报告。没有修改 Story、业务代码、CURRENT、Sprint 或检查脚本，没有读取 `.env`，没有连接数据库/私有服务、发送短信、创建供应商资源或运行带业务写入的探针。摘要哈希固定本次内容复核点；随后仅变更准备记录/交接元数据时不应把本报告当成业务实证。

## 1. 具体发现与修正复核

### P2-01：共享 cookie 的旧标签页可能把 A 的操作提交给 B — 已纳入合同，未实施验证

**草稿位置：** Story T7 的认证代际要求（原第216行）和 T10/AC10–11 测试矩阵。原文要求退出/换账号清理与丢弃迟到响应，但没有明确共享 cookie 的其他标签页、后台页及 bfcache 恢复路径。

**现存代码证据：**

- `apps/mobile/src/App.tsx:16–33` 只在组件挂载时读取 `/me`，身份及 Planner handoff 是该 React 实例的本地状态。
- `apps/mobile/src/home/api.ts:58–68` 每次请求使用 `credentials: 'include'`；第87–88行的新解析/导入动作不携带发起页面所绑定的身份上下文。
- `apps/mobile/src/settings/api.ts:54–64` 同样使用当前 cookie；第84–85行的账号动作目标由后端当前用户决定。

**可触发的问题：** 同一浏览器的两个页面最初均为 A。另一页面退出 A 并登录 B 后，旧页面保留 A 的私人视图/草稿，下一次请求却可能携带 B 的 cookie。只在单个 React 实例内增加 generation、仅检查服务器当前身份或仅拒绝跨 owner 资源 ID，都不足以保护没有既存资源 ID 的“新导入”等动作，也无法保证旧私人视图清理。此处是需要明确覆盖的实施场景，不是声称当前未实施的生产认证已被实际利用。

**建议及已复核修正：**

- Story 第217行明确跨 tab 失效传播、pageshow/bfcache/回前台身份重核，未核实时遮蔽旧私人视图并暂停写入。
- 同行要求将请求绑定到发起页面的预期 owner/session，由服务端在真实认证后比较一致性；预期值不能成为认证凭据，旧 A 草稿/重试不能自动改以 B 的身份执行。
- Story 第240行增加真实浏览器双标签页、后台/bfcache 恢复、迟到响应、通知丢失与同 owner 恢复测试。
- Story 第314行将这些场景纳入 AC10–11 验收矩阵。

**判定：** 准备缺口已关闭。实际机制和浏览器证据仍在未勾选任务中，不能据本次文档修正标记功能已实现。该修正落实现有 AC7/8/10，不新增设备中心、账号合并或新的产品 Story。

## 2. 已核对的完整性与边界

| 校验项 | 独立结果 |
| --- | --- |
| 已批准叙述/范围/GWT | 对正式 `epics.md:487–569` 与实施 Story 提取 Given/When/Then/And；56行逐字一致，即14组完整保留。As a/I want/So that、Requirements 与 IR-01/IR-06 边界一致。 |
| 源合同身份 | front matter 的 source_story_id、source_contract_sha256 与 migration catalog 的1.0条目一致；没有另建执行身份或把历史1.1/1.2当作1.0已完成。 |
| 交付映射 | 交付合同对1.0绑定的 FR1/12/14/15/16、NFR1/3/6/7/20 全部承接；NFR8另由正式Story源Requirements承接。login-attribution 已写入 T0/T8及关闭证据，未被Sentry/Noop替代。 |
| 数据复用 | 实际 Prisma 已有 User/OAuthIdentity/Session；T2明确扩展已有模型，稳定 User.id 与可信外部身份分离，不重复建表/用户目录。Session公开引用与认证secret/摘要区分明确。 |
| 历史owner与任务 | 抽查 dbUserIdFor、sourceHashFor、PlanJob/HqJob external_user_id 及恢复消费，与研究结论相符。T3明确二次hash、去重键、缓存、worker恢复、停止业务自行创建User和无可信归属保留隔离。 |
| 撤权/退出边界 | 当前退出只撤当前会话且不取消受理Job；停用/删除资格使全会话失效。T5覆盖现存worker发布点、活动SSE和重连，不能仅靠最初鉴权或通知缓存。7.5的删除受理/清理仍独立。 |
| 裸入口与未来能力 | fill/export现有入口需要封口或诚实unavailable；没有要求1.0顺带实现5.x。不存在的完整私有下载路径以可复用边界/fixture与后续责任区分，不捏造已验收端点。 |
| 最小运营授权 | 受控稳定身份grant、capability/scope、版本/撤销/审计和每次服务端检查已写入；不是客户端role，也不新增通用权限平台/移动运营页，不等待8.6。 |
| 真实供应商/归因 | 两份研究明确本轮未核验账号/权益。Story保留Apple关联资源、微信宿主、腾讯真实验票和U-Link/U-App纯Web适用性的未知项；不把Authing主候选当成已选型，不虚构现有宿主或自行新建原生App。 |
| 工程条件 | OPS-01、DB-CHANGE-01、METRICS-01/02/03与migration逐Story绑定一致，已有任务、时点、责任和证据要求；生产开放条件与本地代码开发区分，不把一次Story证明扩为全局完成。 |
| 回归与实证 | OpenAPI生成、现有probes去开发头、真实bootstrap、PG双实例/重启、浏览器/CSRF/运营负向和秘密哨兵均有任务。列出的现存server测试脚本可由package.json定位；待新增PG认证脚本没有伪称存在或已运行。 |
| 引用 | 程序检查Story内全部本地Markdown目标存在，复核原型/源文档/研究路径。供应商研究中的官方材料用于理解限制，本审查没有重复执行供应商控制台或真实API核验。 |

## 3. 开发时仍须固定的决定

以下均已在 T0–T10 被明确列为实施任务或真实证据门槛，不作为遗漏或新增产品审批：

1. 依据已有获准资源固定真实手机号/社会化主路径、issuer/client/回调/站内返回允许集，以及实际宿主能力矩阵。公开SDK存在不等于租户权益可用；供应商账号自动关联策略需符合不合并旧数据账号的边界。
2. 在schema/接口落地前固定手机号规范化与命名空间、固定会话期限或续期策略、秘密旋转/并发语义、退出未知结果的可核实合同；旧Map凭据不能因兼容要求被升级成生产身份。
3. 以可信证据决定哪些旧owner可映射，形成干跑、冲突隔离、sourceHash/旧任务兼容及适用恢复方案。不能只修改hash函数或批量按旧测试号码认领数据。
4. 选择实际部署cookie/Origin/CSRF/代理信任与最小grant存储，证明多实例撤权和跨tab一致性；浏览器通知只是加速，一致性校验必须在通知丢失时仍成立。
5. 核验实际U-Link/U-App宿主与可查询事件路径。如确有产品/资源差异，形成具体事实再进入已有范围决定；无证据时保留该项未验收，不把待核验写成确定缺失或自行延期FR14。
6. 提供本次真实PG迁移/恢复、供应商失败/成功、浏览器、多设备、多实例、运营授权和测量样本。OPS与性能目标按各自门槛关闭；本地fixture不替代实际账号/服务、恢复或性能证据。

## 4. 审查证据范围

读取了 AGENTS、CURRENT、project-context、完整Sprint状态、create-story技能/质量清单、正式Epic1相关范围、1.0交付与迁移绑定、工程前置以及两份 `research/story-1-0-*-2026-09-17.md`。代码定向复核覆盖auth/Session、Prisma身份模型、owner转换/去重、Plan/HQ恢复、当前SSE、account队列壳、移动App/登录/API与现有测试脚本定义；结合当前前后端/测试/REST架构、PRD/UX及analytics/rate-limit合同检查范围。

本次实际执行的只读校验为源GWT逐行比较、YAML绑定解析、本地引用存在性检查及定向源码核验。没有执行Story业务验收或真实资源操作。准备状态/授权同步与handoff回归由主代理独立记录，本报告不将其结果冒充身份/会话实证。
