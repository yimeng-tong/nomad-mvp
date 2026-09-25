---
project: nomad-mvp
story_id: "2.5"
date: "2026-09-25"
preparation_status: drafting
validation_kind: author-self-check
independent_review: pending-root
implementation_verified: false
source_contract_sha256: c838289fd9877b9b5386917d24bb2a53986995395c8e9d1da31df2544103e6b0
gwt_scenarios: 15
---

# Story 2.5 准备自查

此为合同作者静态自查，非独立review或实现验收。源catalog指纹 `c838289fd9877b9b5386917d24bb2a53986995395c8e9d1da31df2544103e6b0`，完整源GWT 15组逐行相等；As a/I want/So that、Requirements、源范围/CE/原生/质量/共享UI补充完整保留。

## AC到任务映射

| 源AC | Tasks | 验证关注 |
| --- | --- | --- |
| AC1, AC3, AC10, AC15 | T0 | 核对逐晚输入迁移与搜索能力 |
| AC1, AC2, AC5, AC12, AC13 | T1 | 建立不可变Stay与LuggageTransition命令 |
| AC2, AC3, AC4, AC5 | T2 | 酒店搜索、明确留空与早餐 |
| AC6, AC7, AC8, AC9 | T3 | 同上与上下文行李建议 |
| AC1, AC10, AC11, AC12 | T4 | 日期reconciliation与完整性门禁 |
| AC2, AC6, AC11, AC13, AC14 | T5 | 可复用StayNightEditor与移动交互 |
| AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14, AC15 | T6 | 验证住宿与行李的状态矩阵 |

## 审查结果

- frontmatter来源、当前delivery要求、工程条件与source_obligations按catalog/delivery提取；合同Status=draft、preparation_status=drafting、全部Tasks未执行。
- CURRENT/Sprint、源文档、catalog/delivery、历史done、旧2.2和业务代码/依赖均不在本作者写入范围。
- 实际UPDATE路径已查存在并读取，NEW路径明确为计划；后续前序实现可能改变文件形状，实施T0必须再读。
- 核心回归覆盖owner/重复/unknown receipt/expected revision/迟到结果和本Story业务反例，技术质量与恢复/指标责任进入实际Tasks。
- 原型覆盖缺口按源文本补工作台与浏览器状态，未把图片当功能已完成。

## 仍开放的实施/真实验收门槛

2.3不可变draft与真实确认、1.11 POI有效事实、PG迁移恢复和AMap真实酒店搜索尚待实施；同上、寄存取回的实际fixture与双端真机缺项不能以现有酒店UI关闭。

T7–T8与适用UI/宿主任务分别闭环，不能继承其他Story verified；真实staging/PG/设备/产品目标都未在本次准备执行。缺项阻断所属切片，不抹去源AC或假报done。

## 检查方式

本轮以只读源码核验、官方文档查证和生成后的源GWT逐行/元数据/Tasks覆盖脚本自查；未运行实现测试。后续由root执行跨组独立准备审查、全批次`pnpm run ci:handoff`与必要guard回归。本报告不伪称这些尚未运行结果。
