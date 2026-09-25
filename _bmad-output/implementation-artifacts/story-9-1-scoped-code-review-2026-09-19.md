---
project: nomad-mvp
date: '2026-09-19'
workflow: bmad-code-review
scope: host-runtime-config-and-handoff-guards
story: 9-1-capacitor-app-installation-and-host-foundation
status: patches-applied-focused-regression-passed
review_layers: [blind, edge, auditor]
failed_layers: []
decision_needed: 0
patches: 7
deferred: 0
dismissed: 0
whole_story_complete: false
---

# 9.1 宿主与交接守卫限定审阅

本次由三个独立审阅层检查18个明确文件、1142行差异。Blind只读差异，Edge按实际分支复现，Auditor对照9.1及宿主合同；并行1.0认证实现不在此审阅范围。原生项目/真实设备/身份服务的完整关闭仍未完成，Story保持in-progress。

归并为7项确定修补，无需新的产品选择。用户已授权持续推进与合理决策，直接应用全部修补并保留复现回归；不重复请求逐项批准。

| ID | 来源 | 缺陷与触发 | 修补及证据 |
| --- | --- | --- | --- |
| R1 | blind+edge+auditor | fragment中的code/state/sid绕过query同名检查 | 按fragment/hash-router参数名检查；3条fragment反例先失败后通过 |
| R2 | blind+edge | async返回等待中新Sheet注册，旧遍历仍关闭下层/最小化 | 返回操作绑定registry版本；新注册取消旧操作，下一次返回再处理新层 |
| R3 | edge | 已卸载handler的Promise不结束，返回永远busy | 可取消返回operation与AbortSignal；卸载/注册/后台/停止释放旧等待，新操作不被旧finally覆盖 |
| R4 | edge | 旧hideKeyboard回执把新的didShow状态覆盖成false | 键盘事件epoch；旧回执不改新状态，下一次返回仍先处理键盘 |
| R5 | edge+auditor | 仅Cxx/9.x要求关闭证据，漏掉2.3等31张已绑APP-HOST的Story | 依实际条件绑定要求逐Story真实证据；完整2.3假done反例被拒绝，9.1/9.2构建条件亦不可省略 |
| R6 | edge | 同步刷新被改的批准附录和快照哈希可绕过批准 | 固定批准时的snapshot manifest摘要，连同既有approval摘要核验；伪造附录/current源/全部相关哈希仍拒绝 |
| R7 | edge+auditor | generated config只核对ID/API，放过开发调试、mixed-content和旧WebView下限 | 所有源配置字段深比对，仅允许iOS的CLI管理注册字段；8种安全/版本漂移及未知字段回归 |

聚焦结果：platform两文件45项通过；native-config-proof三个测试组通过（含多种配置漂移反例）；handoff60项通过，保留原43项历史/迁移/状态回归。此前复现得到的失败与修复后通过分别核验，未以更新预期值掩盖风险。

审阅后的最终全mobile/typecheck/build与Android复编译另见9.1实施记录。这里的“修补完成”不代表整张Story done：实际双端安装、macOS/iOS构建/签名、正式身份/供应商和TestFlight等仍按原门槛执行。
