# Story9.4独立代码审阅

基线abac3df至1dee5bd；三层独立无上下文子代理：Blind Hunter、Edge Case Hunter、Acceptance Auditor均完成。代码diff2183行，锁文件/源合同及本轮证据由验收层另行核对。

三层共15条最终报告，两个重复的场景生命周期问题合并，13项patch；0项需产品决定、0项defer。盲审中途提出后自行否定的HMR/进程hang候选不进入最终清单；无失败层。用户已授权CR修复，不再次请求普通执行许可。

| ID | 问题 | 来源 | 状态 |
| --- | --- | --- | --- |
| R1 | cleanup promise复用并串行化场景切换 | blind+edge | 已修复并复核 |
| R2 | 晚到raw fetch必须记录且不能采用下一场景scope | blind+edge | 已修复并复核 |
| R3 | worker注册与当前client mocking激活分开校验 | blind | 已修复并复核 |
| R4 | 静态资源放行不能成为programmatic fetch旁路 | blind | 已修复并复核 |
| R5 | 模块图绑定最终产物bytes并拒绝同名篡改 | blind | 已修复并复核 |
| R6 | 超时用真实取消边界而非延迟网络错误模拟 | blind | 已修复并复核 |
| R7 | loading场景保持等待直到显式取消 | blind | 已修复并复核 |
| R8 | 大字号与长中文在窄屏运行并检查溢出/动作可达 | blind | 已修复并复核 |
| R9 | JSX文件启用正确解析器选项并验证规则命中 | blind | 已修复并复核 |
| R10 | native完整资源摘要写入实际CI产物 | blind | 已修复并复核 |
| R11 | 阻断Accept msw/passthrough绕过 | edge | 已修复并复核 |
| R12 | Node共享清理无条件校验ledger | auditor | 已修复并复核 |
| R13 | 按用途分开Node/browser globals与TS项目 | auditor | 已修复并复核 |

修补后补针对性反例并由对应审阅者复核；CI/真实资源与Story关闭另行判定。

## 复核与实际反例

三层复核均确认原问题已解决。追加复核发现worker.stop发生于getRegistration等待期间仍可能发出请求、以及it.fails可能把隐私断言失败翻为通过；已分别补workerEpoch/二次ready校验，改为共享Node fixture与普通独立反例。最终Blind、Edge（[]）、Acceptance均无剩余发现。父任务实际执行18场景、16故障＋2正常控制、Node网络9、lint6组、资源5组；组件反例强制CI/FORCE_COLOR验证，哨兵未泄漏。R1有真实失败再通过记录。

产物图谱现在包含writeBundle后完整文件hash；同名Web及双端一起被篡改也会失败。完整native inventory写入上传目录。Node允许静态请求的旧出口已关闭，MSW Accept旁路在request:start钩子中记录并清除，以保持请求在合成server内。

首轮远端CI额外暴露彩色输出使正常控制数误判；已用Node内建stripVTControlCharacters修复，不降低零测试失败要求。远端run36115340403原失败保留，不改写成成功；新提交CI另取实证。
