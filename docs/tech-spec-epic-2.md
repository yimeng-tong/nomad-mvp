# Epic 技术规格书：Epic 2 Planning & Editing（天级骨架、候选抽屉、长按编辑、可行性修复、导出）

Date: 2025-11-08  
Author: BMad  
Epic ID: 2  
Status: Draft

---

## 概述（Overview）

本 Epic 面向“规划与编辑”的核心能力，承接 Epic 1 的“从灵感开始”，在灵感选择页（Planner Picker）内完成上下文锚点挑选，生成“部分填充”的天级骨架；在骨架上支持空槽候选/AI 建议/自由活动、长按编辑（替换/移动至 D±1/调时/删除/撤销）、顶部可行性校验与一键修复，并提供导出 PNG。并行启用“快速版（L2 粒度）→优先呈现”与“高质量 LLM 编排（后台并行，完成后可切换-采用）”。  
权威来源：PRD（docs/prd.md）Epic 2、相关 FR/NFR、小节 3.x/5.x/6.x/7.x/9.x；架构 v0.4 分片（docs/architecture/*）。

## 目标与范围（Objectives and Scope）

- In Scope  
  - Story 2.0 Planner Picker（上下文灵感选择，路由与参数、城市 Tabs + 地图联动、已选篮/CTA、生成流程）。  
  - Story 2.1 生成天级骨架（2h/4h 槽，预布局 seed 及撤销、空槽大弹窗、酒店槽与酒店感知软约束、酒店选择逻辑与可选重排、multi_city 分段边界定义在 Post‑MVP）。  
  - Story 2.2 长按编辑与撤销（替换/移动 D±1/调时/删除；8 秒撤销与最近操作入口；步进与吸附；seed 操作优先撤销；历史步骤管理与回滚）。  
  - Story 2.3 可行性校验与一键修复（硬/软冲突分类、修复提案、进入 AI 填充门控）。  
  - Story 2.4 导出 PNG（宽度、切片、WebP/JPEG、预览与埋点，冲突提示来源于 Validator 的修复建议）。  
- Out of Scope  
  - 一次性 AI 填充与质量评测、灰度调优（Epic 3）。  
  - 多城市/transport_slot/hotel_slot 的完整路径为 Post‑MVP，在本 Epic 内仅保证边界兼容。

## 架构对齐（System Architecture Alignment）

- Planner 双路：Quick（L2、2h/4h、同 L1 优先、2.5h 阈值对齐）先呈现；HQ（后台并行）完成后可“切换-采用”。［backend-architecture.md、PRD 3.x/5.x］  
- 服务模块：Router/Library/Planner/Validator/Suggester/Export/HQ 控制面。［backend-architecture.md、frontend-architecture.md］  
- 远程配置：Unleash/Env 提供 planner_autoplace_v1、alpha_autoplace、K_min/K_max 及 mmr_lambda 等。［PRD 3.3］  
- 观察性：Langfuse、promptfoo、Sentry；关键漏斗（登录→入库→选择→骨架→AI 填充→导出）。［PRD NFR6、FR13］

## 详细设计（Detailed Design）

### 服务与模块（Services and Modules）

- Planner  
  - 生成：根据 {city,start_date,days,pace?,selected_items[]} 输出骨架（2h/4h）；支持 seed 预布局配额 quota=ceil(α×S_left) 与撤销；Quick 结果先呈现，HQ 后台并行。  
  - 维护：支持空槽弹窗候选与 AI 建议构建、自由活动插入、酒店槽写入。  
- Validator  
  - 冲突：硬冲突（无坐标/闭店/跨日不可达）与软冲突（略超时/通勤略远）；输出一键修复提案（换序/替换候选/缩短停留/挪日 等）。  
- SlotEditor  
  - 长按编辑：替换、移动至 D±1、调时、删除；时间步进 15 分钟；拖拽吸附 30/60 分钟；跨日正确。  
  - 历史：8 秒撤销 + 最近操作入口；支持回滚至任意快照（自动重排/酒店变更生成快照）。  
- Suggester  
  - 候选构建：时窗贴合 > 距离 > 用户标签（vibe）> 热度；Top‑5 搜索（AMap 文本）/候选/AI 建议；给出 ≤16 字 why。  
- Export  
  - PNG 导出：宽 1080（可 1242）、按天切片；WebP 优先，退化 JPEG 75–80%；预览与埋点。

### 数据模型与契约（Data Models and Contracts）

- Plan(id, user_id, city_id, start_date, days, pace, slot_minutes, state)  
- Journey(id, plan_id, created_at)  
- HQJob(id, plan_id, status, created_at, finished_at, result_ref)  
- Event(id, plan_id, journey_id, session_id, ts, name, props_json)  
- Slot/PlanSlot（概念）：包含时间窗、POI/L2Group 引用、origin（ai_seed/hand）、可冲突标记。  
［data-models.md、PRD 数据层与观测章节］

### API 与接口（APIs and Interfaces）

- Planner / Skeleton  
  - POST /plan/generate {city,start,days,pace,selected_items[]} → {plan_id, slots[]}  
  - GET  /plan/{plan_id}  
  - POST /plan/validate {plan_id} → {hard_cnt,soft_cnt,suggestions[]}  
  - POST /plan/fix {plan_id, action} → 应用修复提案  
- Planner / HQ  
  - POST /plan/hq/start {plan_id} → {hq_job_id}  
  - GET  /plan/hq/status?hq_job_id → {state:'running|done|failed'}  
  - POST /plan/hq/adopt {plan_id,hq_job_id} → 合并 & 版本  
- Export  
  - POST /export/png {plan_id, width_px, slice_by_day}  
（SSOT：docs/api/openapi.yaml；本文为概要）［rest-api-spec.md、PRD 2.x/3.x/4.x］

### 工作流与时序（Workflows and Sequencing）

- Confirm → Picker → Generate（Quick 先呈现；HQ 后台并行）→ 空槽候选/AI 建议/自由活动 → 长按编辑/撤销 → 顶部校验与一键修复 → 预览导出。  
- Seed 预布局：started→freeze→must_go→quota→candidates→place→validate→persist→done；origin=ai_seed，支持 5–8 秒撤销与“一键重置预布局”。［PRD 3.1、3.2、3.3、5.x、7.x、9.x］  
- 酒店感知：hotel_slot 仅展示；晚段/早段 near_hotel 加分不突破硬约束；选择/更换酒店可提示是否重排（仅晚段/整日/取消）。［PRD 5.1/6.1/2.1/2.4/2.5/2.6］

## 非功能需求（Non-Functional Requirements）

- 性能  
  - 核心交互 120–200ms；Quick 路径低延迟；距离矩阵/检索 24h 缓存；HQ 后台不阻塞 Quick。  
- 可靠性  
  - 编辑幂等；撤销/回滚稳定；修复提案可解释；HQ 失败可回退 Quick。  
- 可观测性  
  - 关键漏斗与操作埋点；Langfuse 追踪关键调用（含 seed/hq）；promptfoo 小集回归。  
- 兼容与降级  
  - 弱网：地图降级清单视图；搜索失败提示与兜底。  
［PRD NFR2/NFR6/NFR10/NFR11 等］

## 依赖与集成（Dependencies and Integrations）

- AMap SDK+Web API（检索、逆地理、距离矩阵）；  
- Unleash/Env（planner_autoplace_v1、alpha_autoplace、K_min/K_max、mmr_lambda、hotel_stickiness_enabled 等）；  
- COS/CDN（导出相关媒介资源访问）；  
- 观察性与埋点系统（Langfuse/promptfoo/Sentry/友盟 U‑Link）。  

## 验收标准（权威）（Acceptance Criteria）

- E2‑AC0（Story 2.0 Planner Picker）  
  1) 入口与路由：/planner/pick?city&start&days&source&rec_id。  
  2) 头部参数：城市/日期/天数占位与 Sheet 编辑。  
  3) 视图结构：城市 Tabs（按距离排序，灵感量>1 才展示）+ 卡片 + 地图联动（Sheet 吸附位 High→Split→Map‑Full；弱网回退清单）。  
  4) 已选篮与 CTA：吸底“已选 N｜生成骨架”；允许 0 选生成；参数缺失弹 Sheet 补齐后生成。  
- E2‑AC1（Story 2.1 生成天级骨架）  
  1) 2h/4h 槽位（pace 映射）；must_go/time_hint 优先；transport_slot 作为分段边界；AI 预布局 quota；空选时基于 AnchorPool。  
  2) 空槽弹窗：候选抽屉（时窗/距离/vibe 重排，含“未落位”）、AI 建议、自由活动。  
  3) seed 块 origin=ai_seed，5–8s 撤销与“一键重置”；硬冲突不落位、软冲突仅提示。  
  4) hotel_slot 仅展示；酒店感知软约束（早/晚段加分）；酒店选择逻辑与可选重排（仅晚段/整日/取消），生成历史快照。  
- E2‑AC2（Story 2.2 编辑与撤销）  
  1) 长按编辑：替换/移动至 D±1/调时/删除；  
  2) 撤销 8 秒与“最近操作”入口；  
  3) 步进 15 分钟；吸附 30/60 分钟；跨日正确；  
  4) seed 操作撤销优先；历史步骤管理与任意回滚。  
- E2‑AC3（Story 2.3 可行性校验与一键修复）  
  1) 顶部校验并区分硬/软冲突；  
  2) 一键修复提案；  
  3) 门控：硬冲突禁用进入 AI 填充；仅软冲突可进入且保留提醒。  
- E2‑AC4（Story 2.4 导出 PNG）  
  1) 导出长图：宽 1080（可 1242），超长按天切片；  
  2) WebP 优先，不兼容降级 JPEG（75–80%）；参数 width_px、slice_by_day 与预览提示；  
  3) 埋点完整；冲突时导出前提示当前冲突状态及可修复建议（来自 Validator）。  
［逐条对应 PRD 2.0–2.4 AC 与 FR27/32/33/37/44 等］

## 可追溯性映射（Traceability Mapping）

| AC | PRD 引用 | 组件/API | 测试思路 |
| --- | --- | --- | --- |
| E2‑AC0 | Story 2.0 | Picker + 路由 + 参数 | 集成：路由/参数；E2E：上下文选择到生成 |
| E2‑AC1 | Story 2.1；FR32 | POST /plan/generate；seed 撤销 | 单元：配额/种子标记；集成：候选/未落位；E2E：生成→编辑 |
| E2‑AC2 | Story 2.2 | SlotEditor | 单元：移动/撤销；E2E：跨日与回滚 |
| E2‑AC3 | Story 2.3 | /plan/validate、/plan/fix | 单元：分类与提案；E2E：门控路径 |
| E2‑AC4 | Story 2.4；FR24 | POST /export/png | 集成：参数与切片；E2E：预览/冲突提示 |

## 风险、假设与开放问题（Risks, Assumptions, Open Questions）

- 风险  
  - HQ/Quick 差异导致切换不一致 → 方案：版本化合并与冲突提示。  
  - 候选构建依赖数据不足 → 方案：回退城市热门/Top‑K，来源标注。  
  - 编辑与撤销栈复杂性 → 方案：快照策略最小覆盖、严控幂等。  
- 假设  
  - L2/L1 数据可用；AnchorPool 服务正常或有回退。  
  - 远程配置与开关可动态应用且有默认安全值。  
- 开放问题  
  - 导出 PNG 的服务器端资源限制与排队策略。  
  - 修复提案的“替换候选”来源与可解释性模板。

## 测试策略摘要（Test Strategy Summary）

- 单元（P0）  
  - 配额/seed 标记、撤销与重置、Slot 编辑幂等、校验分类与提案。  
- 集成（P0）  
  - 生成→校验→修复链路；HQ 后台完成与切换；导出参数/切片与预览。  
- 端到端（P1）  
  - Confirm→Picker→Quick→编辑→校验→导出；弱网地图降级。  
- 观察性与性能（P1）  
  - 漏斗事件覆盖；Langfuse/promptfoo；交互 120–200ms 与缓存命中。 


