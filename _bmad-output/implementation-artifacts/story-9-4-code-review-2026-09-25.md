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

## 既有CI测试观察修补

第三轮CI在所有新9.4门禁通过后，原进程测试发生/proc消失竞态。ops/pve-staging/test_bounded_process.py只修只读观察、增加两类反例；bounded_process.py未变。Edge另行只读复核返回[]，4项测试通过。此项属于T6保留原链的可靠性维护，不改变生产进程恢复或1.7关闭条件。

## 旧PG/HTTP探针兼容修补

第四轮CI36120947834通过9.4新门禁及修正后的进程测试，随后旧auth-persistence合成done Job缺少保存结果，被1.7现有不变量正确拒绝。本轮先新增该拒绝反例，再创建同owner/job/sourceHash的Inspiration并核对原结果ID；生产鉴权/日志/租约不改。CI三探针改在apps/server执行，与它们的子进程./src导入一致。

为验证剩余旧链，使用/tmp内新建PG18.6/UTC数据库，schema迁移、auth-persistence、auth-http、ingest-authority均实际通过。HTTP旧探针假定一次read是一个完整SSE事件，本轮改为有界首个data帧读取，保留尾部与解码器、exact owner及撤权后禁止内容断言；3个分片/合并/关闭与上限测试通过。首次进入typed lint的HTTP probe仅把原any JSON边界替换为生成DTO、明确Fastify类型，全部原断言保留。验收层/Edge分别只读复核无剩余发现。独立PG与开发工作台进程已停止，数据/失败记录保留；现有homelab和CI PG15没有改动。

新证据isolated-pg-ci-probes.json；下一取最终CI整链结论。新增实现文件清单包含两个auth probe、sse-probe-reader及其test、CI working-directory变更。
