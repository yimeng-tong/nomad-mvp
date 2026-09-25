---
project: nomad-mvp
story_id: "2.6"
date: "2026-09-25"
preparation_status: drafting
validation_kind: author-self-check
independent_review: pending-root
implementation_verified: false
source_contract_sha256: bfcc65bed33e59b96b0977f60c83469e7971c4b3551cc111974814bcab2edf43
gwt_scenarios: 13
---

# Story 2.6 准备自查

此为合同作者静态自查，非独立review或实现验收。源catalog指纹 `bfcc65bed33e59b96b0977f60c83469e7971c4b3551cc111974814bcab2edf43`，完整源GWT 13组逐行相等；As a/I want/So that、Requirements、源范围/CE/原生/质量/共享UI补充完整保留。

## AC到任务映射

| 源AC | Tasks | 验证关注 |
| --- | --- | --- |
| AC1, AC9, AC10, AC13 | T0 | 固定S5与旧生成入口的桥接边界 |
| AC4, AC5, AC6, AC8 | T1 | 三档pace及单次推断provenance |
| AC7, AC8 | T2 | 保护附加约束原文并分离解析结果 |
| AC1, AC3, AC9, AC10, AC11 | T3 | 唯一开始入口与不可变snapshot |
| AC2, AC3, AC4, AC11, AC12 | T4 | S5摘要与平台受限降级 |
| AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13 | T5 | 验证冻结与幂等完整性 |

## 审查结果

- frontmatter来源、当前delivery要求、工程条件与source_obligations按catalog/delivery提取；合同Status=draft、preparation_status=drafting、全部Tasks未执行。
- CURRENT/Sprint、源文档、catalog/delivery、历史done、旧2.2和业务代码/依赖均不在本作者写入范围。
- 实际UPDATE路径已查存在并读取，NEW路径明确为计划；后续前序实现可能改变文件形状，实施T0必须再读。
- 核心回归覆盖owner/重复/unknown receipt/expected revision/迟到结果和本Story业务反例，技术质量与恢复/指标责任进入实际Tasks。
- 原型覆盖缺口按源文本补工作台与浏览器状态，未把图片当功能已完成。

## 仍开放的实施/真实验收门槛

实际前序S2/S3和服务端snapshot/receipt桥接尚未实现；可靠推断/平台能力需真实可用性核对，不能从旧smartPlanning=true推断。真实PG恢复、模型相关评测与适用App矩阵仍开放。

T6–T7与适用UI/宿主任务分别闭环，不能继承其他Story verified；真实staging/PG/设备/产品目标都未在本次准备执行。缺项阻断所属切片，不抹去源AC或假报done。

## 检查方式

本轮以只读源码核验、官方文档查证和生成后的源GWT逐行/元数据/Tasks覆盖脚本自查；未运行实现测试。后续由root执行跨组独立准备审查、全批次`pnpm run ci:handoff`与必要guard回归。本报告不伪称这些尚未运行结果。
