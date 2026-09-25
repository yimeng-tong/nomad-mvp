---
project: nomad-mvp
date: '2026-09-19'
scope_revision: capacitor-2026-09-19
status: handoff-delivered-monitor-active
target_thread_id: 01a0a132-7203-7871-bf0e-d33087ba371a
target_host: local
target_title: Nomad Sprint Planning
coordination_mode: direct-insertion-approved-by-user
continuous_execution_authorized: true
monitor_state: _bmad-output/implementation-artifacts/capacitor-task-monitor-state.json
---

# Capacitor 范围与持续开发正式交接

用户已批准主提案及合同附录，要求完成“同步→定向就绪检查→开发”，并让现有任务据此调整正在开发的1.0、继续后续BMAD流程。常规准备/开发/验证/审阅不再需要逐项授权；必要合理选择可先决定并记录背景、依据和后果。只有不可绕过的必需资源/凭据阻断对应切片，独立工作继续。

## 已生效的权威来源

- 恢复入口：CURRENT.md、project-context、当前Sprint及其scope_decision/scope_readiness_report。
- 批准：`_bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md`。
- 定向就绪：`_bmad-output/planning-artifacts/implementation-readiness-capacitor-2026-09-19.md`，READY仅限合同承接/本地实现，生产/设备门槛另列。
- 正式源：`_bmad-output/planning-artifacts/epics.md`；9 Epic/62 Story/1052 GWT/66 FR/25 NFR。
- 当前catalog/delivery：本目录9月19日版本；旧9月15/17日快照不改写。
- 1.0实际合同已扩至18组GWT，源指纹同步、T11及APP-HOST-01已落实际任务；最新认证实现和核心审阅记录由1.0任务维护。
- 9.1实际合同已准备并进入in-progress，源8组GWT完整；源码/工具/实际构建及开放项见 `story-9-1-dev-progress-2026-09-19.md`。

## 当前代码与写入边界

本任务提供React/Vite共用Capacitor宿主、精确版本、构建配置/验证、Android/SPM iOS工程、src/platform接口、main启动和独立safe-area CSS，以及新交接guards。既有App/各Sheet、auth与后端/OpenAPI/生成types、packages/native-auth由原任务维护；原任务已确认并完成相应接入/实现阶段。保持同一工作树已有修改，不重置、覆盖或复制旧迁移镜像。

`src/platform/host.ts`提供native host识别、返回注册、resume/URL/安全问题订阅及外链；回调/身份/输入的实际验证属于业务。返回handler可接收AbortSignal；注册变化/卸载/后台取消旧等待，busy须消费本次返回。URL是未信任输入，系统打开不是业务成功。

NativeAuth注册名NomadNativeAuth，apiOrigin为固定HTTPS DNS-name origin、apiBasePath独立默认/api；原生凭据不暴露JS、不走Web Cookie回退。开发缺API/法律配置真实不可用。正式标识/签名未核验时只有明确的development namespace，不冒充已登记。

源码/配置/生成assets、模拟fixture和构建日志不能充当`app_delivery_evidence`。所有APP-HOST绑定Story在review/done时均需逐Story实际证据，不能因没有新增Cxx段跳过。批准文件和原始快照摘要固定；后续合理技术决策写新ADR/进展，不悄改旧批准事实。

## 下一步

1. 根据新版1.0的AC15–18/T11、原生网络/安全存储/回调/API/SSE/下载/归因及三端矩阵调整已经开发的内容。保留已验证PG/会话/owner/资格及六项核心review修补，不重做无关领域。
2. 将9.1当前可用工程与接口用于联调，完成真实资源/设备证据后再关闭相应App条款；9.2最终APK/TestFlight不作为早期认证循环前置。宿主侧硬件门槛未关闭时，共享后端、当前可验证切片和后续独立准备可继续。
3. 按当前preparation_order与next_story_to_prepare继续create-story→dev-story→针对性测试/审阅；目前下一个未准备合同为1.6。保持源指纹、任务、工程条件、CURRENT/Sprint和File List一致。不要只按backlog扫描，不自动把同号旧文件当当前合同。
4. 3.1仍paused，真实五项上游、当前合同及keep/change/remove审计满足后才能恢复；旧2.2永不独立派发。7.2、8.7/8.8及四项延期FR保持。
5. 遇到可自行解决的依赖/工具/代码问题持续修复并记录决定；遇到真实Key、正式协议/账号资源、Mac/签名/真机等未给信息只说明具体缺项，复用已问问题，继续其余可做工作。不要把未核验说成资源不存在。

## 定时协调规则

已直接插入协调信息，正式完整交接发送状态记录于monitor_state。监控每30分钟只读检查本轮任务状态；仍运行且无新可行动问题时保持安静。完成后核对是否消费本次范围和持续授权；未同步的完整交接只发一次。若停在普通“等待继续/授权”，可按用户已给授权发送一次具体继续指令；同一完成turn不重复催促。

对已经报告且未变化的硬阻断不重复刷屏，不自行改写该任务业务代码或另启竞争写入者。用户明确暂停/停止时尊重指令；最终当前MVP真实完成后停止这项跟进。定时配置的实际ID/结果和每次有效协调动作写monitor_state；尚未配置成功前不声称监控已生效。

## 已发送与监控配置

完整交接已通过send_message_to_thread实际发送至指定任务，此前直接协调也已收到对方确认。30分钟heartbeat `nomad-app` 已创建并ACTIVE，view操作已在App展示卡片；执行/去重状态在monitor_state维护。9.1保持in-progress，原任务继续真实资源联调和后续授权队列；本次交接不是整个MVP已完成。

## 接收确认与后续推进（2026-09-19 06:21 CST）

主任务已确认完整消费交接并建立持续目标。随后通过read_thread、wait_threads和CURRENT核实，新一轮已运行，1.6已进入in-progress，下一个待准备合同为1.7。无需再次发送完整交接或常规催促；监控继续仅处理新的可行动变化。1.0/9.1仍保留真实资源和设备验收门槛，3.1保持暂停。

主任务在最新认证修补后重建了Android开发包，当前文件SHA-256已本地核验为`4445bd94860a55f11acb860c9730e15567f26541f6968294706a4a49ad5fd426`。构建和验证依据为`story-1-0-local-validation-2026-09-19.json`；9.1之前的摘要继续作为当时构建的历史证据保留。当前开发包仍无真机安装验收，不构成正式发行或TestFlight完成证明。


## 后续UI范围与执行边界（2026-09-20）

用户已批准UI完整方案及Firefox128/WebSafari16.4/Query/Router；源、实际合同和CURRENT已直接同步，共享工作区交接见ui-foundation-handoff-2026-09-20.md。此前Capacitor完整交接的发送/接收记录仍为历史，本次未再次发送消息或宣称目标任务已读取UI更新。主任务1.7资源阻断且完成后停止，监控不得把有意停止当普通等待授权来重启；新9.4待准备指针不等于开发派发。
