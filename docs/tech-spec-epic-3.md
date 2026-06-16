# Epic 技术规格书：Epic 3 AI Fill & Evaluation（一次性 AI 填充、观测评测、灰度与调优）

Date: 2025-11-08  
Author: BMad  
Epic ID: 3  
Status: Draft

---

## 概述（Overview）

本 Epic 聚焦“一次性 AI 填充（不改时间与顺序）”与“观测/评测、灰度与调优”。在 Epic 2 的天级骨架基础上，对“剩余可控非自由活动块”进行一次性编排，并为“所有块”补全「做什么/准备/注意」；对事实引用进行可追溯性约束（无来源时降级为“通用建议”并标注“注意事实核查”）；同时完成 Langfuse/promptfoo/Sentry 等观测与评测接入，配置 BYOK 安全与隐私、账号删除与数据导出闭环、国内依赖降级策略等合规要求。  
来源：PRD（docs/prd.md）Epic 3、FR39/FR40/FR37/NFR12/NFR3/NFR7/NFR17；架构 v0.4 分片。

## 目标与范围（Objectives and Scope）

- In Scope  
  - Story 3.1 一次性 AI 填充：仅对“剩余可控块”做编排；对“所有块”补齐文案；不改变时间/顺序；可“应用全部”。  
  - Story 3.2 观测与评测：Langfuse 记录提示版本与调用追踪；promptfoo 离线 A/B 评测；前后端接入 Sentry；指标看板与关键质量指标。  
  - Story 3.3 安全与合规：BYOK（KMS/Envelope）、隐私与删除导出闭环、版权与国内依赖降级策略。  
- Out of Scope  
  - 规划/编辑/导出等属于 Epic 2；  
  - 多城市/transport/hotel 的完整编排体验不在本 Epic。

## 架构对齐（System Architecture Alignment）

- Filler 服务：对 Plan 的“剩余可控块”执行一次性编排；对所有槽输出文案与引用；不修改 Slot 时间/顺序。  
- Provider 抽象：OpenAI 兼容（api_base + model）；远程切换/回退，BYOK 覆盖；Langfuse 追踪；超时/重试/限流。  
- 观察性体系：Langfuse（prompt_version 与 trace）、promptfoo（离线小集回归）、Sentry（前后端）。  
- 合规：KMS/Envelope、对象存储签名 URL、最小必要数据、账号删除/数据导出闭环。  
［backend-architecture.md、testing-strategy.md、observability.md、PRD 技术假设/NFR/FR］

## 详细设计（Detailed Design）

### 服务与模块（Services and Modules）

- Filler（一次性填充）  
  - 输入：plan_id、scope='all|slot'、slot_id?  
  - 规则：仅“剩余可控块”做编排；所有块都补齐 3×30 字上限的“做什么/准备/注意”；无可用事实引用时降级为“通用建议”并标注“注意事实核查”。  
  - 产出：slot-level notes/attachments/why_short 与引用来源（来源 ID/时间戳/摘要）；不改变已有时间/顺序。  
- ResultSheet（结果页）  
  - 只读预览；“应用全部”将写回；seed/编辑路径回 Epic 2。  
- Observability  
  - Langfuse：记录 prompt_version、工具 I/O 摘要、trace/span；  
  - promptfoo：离线 A/B；  
  - Sentry：错误与上下文。  
- Security/Privacy  
  - BYOK：KMS/Envelope；COS 私有读写 + 签名 URL；日志脱敏；账号删除/导出闭环。

### 数据模型与契约（Data Models and Contracts）

- Plan/Journey 与 Slot：沿用 Epic 2；  
- Fill（概念）：针对每个 slot 的 notes/attachments/why_short/citations[]；  
- 观测事件：prompt_version、provider、latency_ms、cost、error_rate 等指标；  
［data-models.md、PRD NFR12/NFR17］

### API 与接口（APIs and Interfaces）

- Filler / AI Fill  
  - POST /fill/apply {plan_id, scope:'all|slot', slot_id?} → {updated_slots[], warnings[]}  
- Observability Hooks（可选中转）  
  - POST /events  
（SSOT：docs/api/openapi.yaml）［rest-api-spec.md、PRD 3.1/3.2/FR37/FR39］

### 工作流与时序（Workflows and Sequencing）

- 一次性填充：  
  1) 输入 plan_id 与 scope；  
  2) 构建待处理槽集合（“剩余可控块”）；  
  3) 生成文案：做什么（≤3×30）、准备（≤3×30，可选）、注意（≤3×30，可选）；  
  4) 附带 why_short 与引用（可追溯：来源 ID/时间戳/摘要）；  
  5) 无可用来源时降级为“通用建议”并标注“注意事实核查”；  
  6) 输出 warnings[]；  
  7) 预览（ResultSheet）→“应用全部”写回。  
- 事实引用与追溯：NFR12；失败时降级策略保持不中断用户流程。  

## 非功能需求（Non-Functional Requirements）

- 性能  
  - 端到端 P50 目标（由架构阶段细化与监测）；后台任务/并发控制与回退优先保障交互流畅。  
- 可靠性  
  - 错误与降级路径清晰；不改时间与顺序的硬约束；  
- 可观测性  
  - Langfuse/promptfoo/Sentry 接入完备；质量指标与北极星看板；  
- 安全与隐私  
  - BYOK KMS/Envelope、日志脱敏、COS 私有读写 + 签名 URL；账号删除/数据导出闭环；版权合规与国内可替代策略。  
［PRD NFR3/NFR6/NFR7/NFR12/NFR17/FR37/FR39/FR40］

## 依赖与集成（Dependencies and Integrations）

- LLM Provider（OpenAI 兼容接口）；  
- Langfuse/promptfoo/Sentry；  
- COS/CDN；  
- 反馈入口（Settings/Backoffice 相关在 PRD）。  

## 验收标准（权威）（Acceptance Criteria）

- E3‑AC1（Story 3.1 一次性 AI 填充）  
  1) 仅对“剩余可控块”做编排；  
  2) 为“所有块”补齐“做什么/准备/注意”；  
  3) 不改变时间与顺序（硬约束）；  
  4) 可“应用全部”；  
  5) 对每个槽位输出 why_short 与事实引用；若“做什么”无可用事实引用，则降级为“通用建议”并标注“注意事实核查”。  
- E3‑AC2（Story 3.2 观测与评测）  
  1) Langfuse 记录提示版本与调用追踪；  
  2) promptfoo 支持离线 A/B；  
  3) 前后端接入 Sentry；  
  4) 指标看板包含北极星与关键质量指标（seed_accept_rate、seed_conflict_rate、seed_time_ms、fallback_rate 等延伸）。  
- E3‑AC3（Story 3.3 安全与合规）  
  1) BYOK 采用 KMS/Envelope；COS 私有读写与签名 URL；日志脱敏；  
  2) 账号删除与数据导出闭环；  
  3) 版权标注规范与国内可替代/降级策略。  
［逐条对应 PRD 3.1/3.2/3.3 与相关 FR/NFR］

## 可追溯性映射（Traceability Mapping）

| AC | PRD 引用 | 组件/API | 测试思路 |
| --- | --- | --- | --- |
| E3‑AC1 | Story 3.1；NFR9；FR37/FR39 | POST /fill/apply；Result 预览 | 单元：约束与降级；集成：引用追溯；E2E：预览→应用 |
| E3‑AC2 | Story 3.2；FR13；NFR6 | 观察性接入 | 集成/E2E：追踪与看板指标 |
| E3‑AC3 | Story 3.3；NFR3/NFR7/NFR17 | KMS/COS/隐私流程 | 集成：BYOK 流程；E2E：删除/导出闭环 |

## 风险、假设与开放问题（Risks, Assumptions, Open Questions）

- 风险  
  - 事实引用不可用/不稳定 → 降级“通用建议”并显式标注；  
  - 成本/时延：Provider 退避与并发限制；  
  - 文案上限与可读性。  
- 假设  
  - Provider 统一抽象可按任务路由；BYOK 可覆盖；Langfuse/Promptfoo/Sentry 可用。  
- 开放问题  
  - 引用选择与展示策略的最终 UX 细节；  
  - “应用全部”与 slot‑level overrides 的冲突解决策略。  

## 测试策略摘要（Test Strategy Summary）

- 单元（P0）  
  - 约束：不改时间/顺序；无引用降级逻辑；why_short 与 3×30 格式校验。  
- 集成（P0）  
  - POST /fill/apply 输出与预览；观察性事件完整；BYOK 加解密链路。  
- 端到端（P1）  
  - 骨架→一次性填充→预览→应用全部；删除/导出闭环验证。  
- 质量与性能（P1）  
  - promptfoo 小集回归；Langfuse 时延/错误率；成本监测与退避。 


