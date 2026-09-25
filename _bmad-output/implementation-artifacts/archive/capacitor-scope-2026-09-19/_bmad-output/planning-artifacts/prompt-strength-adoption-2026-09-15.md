---
project: nomad-mvp
date: 2026-09-15
status: applied-and-revalidated
userApproved: true
approvedGroups: 18
sourceAudit: ux-prompt-strength-audit-2026-09-14.md
storyCount: 60
gwtScenarioCount: 1018
frInventoryCount: 65
nfrCount: 24
changedStoryCount: 32
sprintPlanningAuthorized: true
sprintPlanningDestination: new-conversation
requestedModel: gpt-6-astra
requestedReasoning: max
implementationAuthorized: false
runtimeVerified: false
---

# 18组提示呈现采用与SP交接

用户已明确认可独立18组综合方案，并授权在没有其他规划前置时进入Sprint Planning；SP必须在
新对话运行，模型Astra、思考强度max。本轮只落实规划文本/验收呈现与交接，不在旧对话运行SP
或启动业务实现。

## 已采用的呈现规则

主报告18组全部落入front-end-spec的Prompt Presentation表、PRD/UX源与相应正式Story。
非阻断建议用可读行内说明和单一入口，细节按需展开；当前操作失败、结果未知、硬问题及
必要确认保留原有处理。数字N均取对应模块/版本的真实集合，不新增全局强制核查清单。

| 组 | 当前文案/层级 | 关键保留边界 |
| --- | --- | --- |
| 1 | 导入对应项“已添加 N 个链接，部分内容未识别”／“部分内容已保存”；终止“这条导入未完成”。 | 有效条目继续；未保存内容不当已保存。 |
| 2 | “已在灵感库”／“正在导入”，就近查看。 | 原任务/owner隔离，不重复创建。 |
| 3 | 无匹配“未找到”，原本支持手工的路径才加“可手动填写”；失败“搜索暂不可用 · 重试”。 | 不新增未批准的手工酒店能力，不混淆失败/空结果。 |
| 4 | “路程时间暂缺”，原因进详情。 | 不用0或假精度替代未知，原可达性门禁保持。 |
| 5 | “较满”“部分通勤待核对”“天气临近出发再核对”。 | 缺哪个字段就说明哪个，缺步数不能冒充缺通勤；真实hard问题仍及时可见。 |
| 6 | “附近估算 · 以{地标}为参考”，详情“实际位置建议核对”。 | 代理身份与原事实不混淆，预览/确认保持。 |
| 7 | soft-only为“有 N 项建议核对 · 查看”；hard/mixed保留简短问题提示。 | 不自动弹FixSheet，不改分类、修复、版本或下游门禁。 |
| 8 | “暂时无法预估，保存后会检查”。 | 无法预估不是无影响；实质变化确认/结构校验保持。 |
| 9 | “这次暂时无法调整”+具体原因+“当前计划未改动”。 | 不制造不安全方案或空revision。 |
| 10 | “还有 N 处细节可完善 · 去完善”，总览保留两行摘要。 | 槽位失败/未生成/建议核对分清，最小S10/S9回环不变。 |
| 11 | S9/S11 soft为“有 N 项建议核对 · 查看”，主按钮是明确继续动作。 | 不加逐条确认；离开App的图片仍带必要提醒/来源。 |
| 12 | “行程已有更新，可重新生成”。 | 已完成旧图仍可用；过期生成预览不能继续生成。 |
| 13 | “将下载 N 张长图”，范围按需展开。 | 数量事先可见，完整城市边界/有序批次保持。 |
| 14 | 实际采用计划基准时主显“已按行程位置推荐”，原因进依据。 | 无基准不得虚构；距离起点、静态池/手动路径保持。 |
| 15 | 模块内“候选暂未更新”／“暂未更新 · 重试”。 | 失败不当空/任务终止；撤权清数据、来源截至真实。 |
| 16 | “清单中已有”／“建议暂未生成，可直接添加”。 | 不自动覆盖；未保存仍明确未保存。 |
| 17 | 副本范围简述、敏感数据说明；普通下载“已开始下载，请确认”；反馈突出编号/时间。 | 无保存回执不报已保存，已收到不等于已处理；去留后果事前说明。 |
| 18 | “暂估”“待核对”“等待使用”“数据截至…”就近保留，长定义查看来源。 | 权限/关键未知/生产影响不后置，不取消发布或真实外发确认。 |

## 实际变更范围

32张Story仅修订既有验收条款的呈现。所有When及GWT数量不变；3.4两条Given只补充
soft-only入口的点击与无障碍适用范围，没有改变Validator的业务判断。

当前变更Story：1.6, 1.8, 1.9, 1.10, 2.4, 2.5, 2.10, 2.14, 2.15, 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 4.6, 4.7, 5.1, 5.2, 5.4, 5.5, 6.2, 6.4, 7.1, 7.4, 7.6, 8.2, 8.3, 8.4, 8.5, 8.6。

新1.0、1.11手工纠错、7.5全账号删除、七张历史Story保持；5.1最小宿主页/来源/返回、
普通下载固定文案及未知结果处理、账号删除、生产发布和实际外发的必要确认仍保留。
源镜像与实际差异核验见下列记录：

- [第1–9组采用记录](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/prompt-adoption-1-9.md)。
- [第10–18组采用记录](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/prompt-adoption-10-18.md)。
- [批准输入及交接风险](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/prompt-adoption-inputs-and-handoff-review.md)。

## 交接原则

CURRENT.md给出精简当前状态与读取顺序，旧长版独立留档。新对话不继承旧聊天记录，直接读取
当前文件，按用户已授权运行SP。要保留尚未提交的全部规划输入，不能从缺少这些文件的默认
分支快照开始。旧Sprint在新任务开始SP前保持不变，旧Epic1完成仅证明1.1–1.5历史范围；
新1.0/1.6–1.11不得被旧aggregate done吞掉。旧2.2迁入3.1只有一个执行身份，保留baseline与Git历史。

只有epics.md是正式Story清单；覆盖报告/拆分提案/历史归档不是第二份队列。七项OPS/DB/
VECTOR/METRICS条件挂到所属任务，延期7.2/8.7/8.8不作为本期可执行Story。新任务只运行SP，
不因此直接执行dev、模型调用、部署、采购或数据操作。


## 最终核验

18组采用独立复核通过，无未关闭规划问题。32张Story呈现改变、28张不变，仍60张/1018组；
全部When不变，3.4两处Given仅增加soft-only入口/无障碍适用。1.0、1.11、7.5和七张历史
Story完整不变，所有源镜像一致；277个保护路径（业务/API/Prisma/旧实施/Sprint/图片等）未变。
[最终复核](/home/tong123/work/nomad-mvp/_bmad-output/planning-artifacts/prd-updates/2026-09-15/prompt-adoption-final-review.md)。
当前可在用户指定的新Astra/max对话开始SP，无须重新批准CE、IR、18组提示或SP入口。
