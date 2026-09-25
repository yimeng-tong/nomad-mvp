# Story9.3 对在制领域Story的集成与证据影响

范围为9.3共享UI迁移，当前测试补证提交aeadc1e79e1243c942b3db0216b945174eca0256。领域权威仍在原auth、host、controller、journal与cursor；四张在制Story保持in-progress，各自条件不因9.3的UI证明自动verified。当前完整CI36184294356及下载复核已通过，本地gate已发布于evidence/story-9-3-ui-2026-09-26/local-ui-regression.yaml。

| Story | 实际受影响入口 | 已执行的限定回归 | 仍由该Story承担 |
| --- | --- | --- | --- |
| 1.0 | Login共享Button/Field/Input/状态，App私有边界，Settings当前退出确认 | 真实Chromium原auth探针6项；三引擎登录/IME/协议/跨tab/身份遮蔽/未知退出；真实PG认证链与原mobile测试 | 真实PNVS/法律/HTTPS、适用Apple/微信交换和冷暖回调、许可/SDK/匿名关联、真实归因及生产数据/测量/双端验收 |
| 1.6 | HomeSheet兼容适配、Home Tabs、受身份中断的读取与候选、Dock可见性 | 产品B07真实11秒遮挡与剩余可见窗口；B08实际crypto挂起后一次POST；B29关闭中checking恢复；PG/IDB/FIFO与跨owner回放 | 实际归因事件与SDK/许可接线、U-Link宿主、真实查询、双端输入与性能/费用基线。没有重写journal或controller |
| 1.7 | Dock渲染/ACK时机所依赖的实际遮挡，App身份边界 | 原durable-dock-pg-browser-probe6项：真实PG18.6/SSE/IDB、3个浏览器进程与1次SIGKILL、原cursor、后台不耗窗口、多job公平及A→B→A隔离，新增ingest POST为0 | 原生bridge/设备恢复、生产物理备份+WAL/PITR、独立目标/RPO/最新删除抑制、真实负载与正式目标 |
| 9.1 | 复用host返回/键盘/前后台接口，静态旧浏览器退出，shared modal层级和safe-area | native:sync/verify、Web与双端完整assets隔离、host-driver单元验证；三引擎模拟host回调为隔离边界 | Mac/Xcode构建、正式标识/签名、真实最低/当前设备安装升级与系统行为。当前浏览器结果不是原生验收 |

原探针以6e0b973执行，输出重定位到新临时目录，仅修改绝对导入/项目根和输出路径，保留原场景断言。后来产品改变仅为共享Modal的绿色焦点CSS，由0061cf9及后续三引擎B05/视觉证明覆盖；aeadc1e新增测试和文档，没有新产品逻辑。证据在evidence/story-9-3-ui-2026-09-26/legacy/{auth-report,pg-browser,verification}.json，28份旧证据摘要未变。

本轮只重新执行上述受影响探针，没有把旧operation-journal存储压力、遥测、生产备份/PITR及测量报告重算为当前9.3成功。隔离库nomad_auth_test_story93_ui_20260926_r1使用已有本地专用PG实例的新数据库；相关临时服务已停止，既有库/备份/发布未修改。鉴权、PNVS与浏览器API在标明处为替身，供应商请求0。

后续沿近期计划第5步继续1.0/1.6未完成代码；实测资源只阻断其依赖切片。现查PersistentAuthService明确拒绝非phone配置，Login third_party只报暂未开放；App未消费createTelemetryRuntime，仍由组件默认Noop。配置字段、字典、封装和已下载SDK都不算已接通。先复用现有安全实现，按实际源合同补第三方、许可/规范事件/SDK边界，不重写已验证会话与日志；再临近开发时准备1.8。3.1继续paused，9.6/9.7仍按近期顺序。
