# Story9.3 本地切片独立审阅

Status: patches-rechecked-canonical-verification-pending
Source: a60674b5a3422b09ad2c4f3a6f13cff749917e4f
Baseline: 775b132f64bf0d6831150d95a6f9192e814f39ce
Scope: T8 local implementation review; whole Story remains in-progress, T9 real-device gates open

已按bmad-code-review分组完整代码diff：运行时1970行、工具/回归1685行。Blind Hunter与Edge Case Hunter使用无主任务对话的新上下文；新建第三审阅者触发agent thread limit后，复用独立只读integration audit agent做Acceptance Auditor，没有接收主任务实现对话。三层均完成有效审阅。

| ID | 来源 | 结论及证据 | 分类 |
| --- | --- | --- | --- |
| CR1 | blind + edge + acceptance | HomeSheet逻辑关闭后260ms退出被checking中断，旧activity completed丢失；同owner恢复时open=false/presence旧，父级状态与Dock暂停残留。Edge的真实组件JSDOM/受控动画探针复现closes0/domain true/reopen false。 | patch |
| CR2 | acceptance | cancel只abort而不结算pending；忽略signal的业务决定会永久占据后续close。纯函数探针显示aborted=true、nextRequestIsOldPending=true、decisions1。 | patch |
| CR3 | blind | 合成keydown无浏览器默认submit，原B26不能证明Login接线抑制IME；需要真实Enter与229 defaultPrevented及移除防护负例。 | patch |
| CI1 | primary / canonical CI36172229448 | 候选32/33通过；Chromium V11在320×740中关闭按钮viewport ratio0.990767，未达到1。下载截图显示底部裁切，不能接受基线。 | patch |

无须新增产品决策，无defer。Edge初步的“B23触发器丢失”经核对HomeScreen持续传restoreFocusTo及实际Chromium B23后撤回，非最终缺陷。

用户既有持续开发/修补授权适用全部patch，无需重复动作选择。发现已写入Story Review Findings；先补失败回归再修补、独立复核及当前CI。技能通用done规则受源Story/T9和用户保留原生门槛约束，不会因局部CR通过把9.3标done。

## 修补与定向复核

CR1/CR2/CR3已修补，原审阅者复核关闭；CR1真实B29旧实现失败→修补后通过，CR2两条不解决旧Promise的取消反例先失败后通过，CR3移除composition接线后真实Enter产生1次verify并被目标断言拒绝，保留trace。新增P3/CR4隐式trigger保持也已修补，Blind复核通过，真实工作台ImplicitFocusRecovery通过。当前工作台31例、移动265+5配置；本地产品5负例+8控制通过。

CI1原实际Chromium几何为action bottom740.40625、popup bottom740、scrollTop12、scrollHeight430、clientHeight400；scroll-padding16px让滚动目标留在可视边界内，未调整ratio1/截图门槛。B30已通过，仍等新canonical33图复验。完整产品矩阵新增关闭恢复/窄屏/外侧点击为B29–B31，现129项；下次最终CI才验证整个当前版本。

当前无未修补代码发现；CI视觉审阅与整体本地gate尚未结束，T9不变。详见evidence/story-9-3-ui-2026-09-26/review-fix-validation.json。未标整Storydone。

## 逐图审阅补充CI2

6e0b973候选CI36176188637的33项和当前源/构建/viewport/DPR校验全部通过。主任务原尺寸查看全部33张，发现V06沿用旧业务按钮的半透明粉色focus环；进一步真实B05测得1.4947557784，对比阈值3未满足，因此本轮候选仍拒绝。其他30张完成布局审阅，不自动发布baseline。

共享Modal后代控件改用已批准的深绿3px环/3px offset；B05新增真实合成颜色/宽度断言，旧源失败→修补后通过。B20补齐新标题的实际200%放大及关闭文字范围检查并通过；没有为未失败的字形改变布局。新增weak-focus故障回放目标断言，完整CI仍会执行。所有原像素/ratio/对比阈值保留。
