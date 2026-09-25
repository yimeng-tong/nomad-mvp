---
project: nomad-mvp
story_id: "2.3"
date: "2026-09-25"
preparation_status: drafting
validation_kind: author-self-check
independent_review: pending-root
implementation_verified: false
source_contract_sha256: 1428d9ceeafc7058789b2431729ac45a0e0fbba0e1cdecf856f2990d51e36aed
gwt_scenarios: 11
---

# Story 2.3 准备自查

此为合同作者静态自查，非独立review或实现验收。源catalog指纹 `1428d9ceeafc7058789b2431729ac45a0e0fbba0e1cdecf856f2990d51e36aed`，完整源GWT 11组逐行相等；As a/I want/So that、Requirements、源范围/CE/原生/质量/共享UI补充完整保留。

## AC到任务映射

| 源AC | Tasks | 验证关注 |
| --- | --- | --- |
| AC1, AC10, AC11 | T0 | 核对S2输入与表单试点资源 |
| AC1, AC3, AC9 | T1 | 先定义PlanningDraft、修订与命令回执 |
| AC3, AC8 | T2 | 完成日期、本地时钟与后续草稿reconciliation |
| AC4, AC5, AC6, AC7, AC8 | T3 | 实现三个独立可确认的到离边界分支 |
| AC1, AC2, AC4, AC10 | T4 | 拆出旅行时间页面与安全导航 |
| AC8, AC9, AC10 | T5 | 实现保存、未知回执和恢复竞态 |
| AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11 | T6 | 封存S2独立验收与回归 |

## 审查结果

- frontmatter来源、当前delivery要求、工程条件与source_obligations按catalog/delivery提取；合同Status=draft、preparation_status=drafting、全部Tasks未执行。
- CURRENT/Sprint、源文档、catalog/delivery、历史done、旧2.2和业务代码/依赖均不在本作者写入范围。
- 实际UPDATE路径已查存在并读取，NEW路径明确为计划；后续前序实现可能改变文件形状，实施T0必须再读。
- 核心回归覆盖owner/重复/unknown receipt/expected revision/迟到结果和本Story业务反例，技术质量与恢复/指标责任进入实际Tasks。
- 原型覆盖缺口按源文本补工作台与浏览器状态，未把图片当功能已完成。

## 仍开放的实施/真实验收门槛

真实AMap手工地点查询、PlanningInputs实际迁移/恢复和9.3/9.6/9.7前序代码尚待实施；RHF精确peer需T0核验。原生实机、生产恢复与版本化目标未关闭。

T7–T8与适用UI/宿主任务分别闭环，不能继承其他Story verified；真实staging/PG/设备/产品目标都未在本次准备执行。缺项阻断所属切片，不抹去源AC或假报done。

## 检查方式

本轮以只读源码核验、官方文档查证和生成后的源GWT逐行/元数据/Tasks覆盖脚本自查；未运行实现测试。后续由root执行跨组独立准备审查、全批次`pnpm run ci:handoff`与必要guard回归。本报告不伪称这些尚未运行结果。
