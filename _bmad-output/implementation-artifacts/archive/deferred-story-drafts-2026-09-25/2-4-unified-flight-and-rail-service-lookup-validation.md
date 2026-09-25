---
project: nomad-mvp
story_id: "2.4"
date: "2026-09-25"
preparation_status: drafting
validation_kind: author-self-check
independent_review: pending-root
implementation_verified: false
source_contract_sha256: dba3820da64fa52fa659fd6e4a9b74b3fb0fdbd120139023ef07a63a0b063a28
gwt_scenarios: 14
---

# Story 2.4 准备自查

此为合同作者静态自查，非独立review或实现验收。源catalog指纹 `dba3820da64fa52fa659fd6e4a9b74b3fb0fdbd120139023ef07a63a0b063a28`，完整源GWT 14组逐行相等；As a/I want/So that、Requirements、源范围/CE/原生/质量/共享UI补充完整保留。

## AC到任务映射

| 源AC | Tasks | 验证关注 |
| --- | --- | --- |
| AC2, AC6, AC7, AC12, AC14 | T0 | 限定Provider与registry选择研究 |
| AC1, AC2, AC3, AC4, AC5 | T1 | 定义统一识别、候选与结果合同 |
| AC6, AC7, AC8, AC10, AC11 | T2 | 规范化flight/rail事实并处理terminal |
| AC3, AC4, AC11, AC12 | T3 | 缓存、预算、隐私与迟到结果 |
| AC8, AC9, AC10, AC11 | T4 | 通过显式选择写入S2当前revision |
| AC1, AC4, AC5, AC8, AC11, AC13 | T5 | 交付单输入混合列表与无障碍 |
| AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14 | T6 | 完成分类/双Provider/保存的证据矩阵 |

## 审查结果

- frontmatter来源、当前delivery要求、工程条件与source_obligations按catalog/delivery提取；合同Status=draft、preparation_status=drafting、全部Tasks未执行。
- CURRENT/Sprint、源文档、catalog/delivery、历史done、旧2.2和业务代码/依赖均不在本作者写入范围。
- 实际UPDATE路径已查存在并读取，NEW路径明确为计划；后续前序实现可能改变文件形状，实施T0必须再读。
- 核心回归覆盖owner/重复/unknown receipt/expected revision/迟到结果和本Story业务反例，技术质量与恢复/指标责任进入实际Tasks。
- 原型覆盖缺口按源文本补工作台与浏览器状态，未把图片当功能已完成。

## 仍开放的实施/真实验收门槛

未选的China-capable flight/rail Provider、合法版本化registry、实际数据/预算/权限及双路真实staging均为T0/关闭必要门槛；不得编造Provider名或凭据。2.3未实现前只可开发独立classifier/contract fixture，不能宣称已写回真实S2。

T7–T8与适用UI/宿主任务分别闭环，不能继承其他Story verified；真实staging/PG/设备/产品目标都未在本次准备执行。缺项阻断所属切片，不抹去源AC或假报done。

## 检查方式

本轮以只读源码核验、官方文档查证和生成后的源GWT逐行/元数据/Tasks覆盖脚本自查；未运行实现测试。后续由root执行跨组独立准备审查、全批次`pnpm run ci:handoff`与必要guard回归。本报告不伪称这些尚未运行结果。
