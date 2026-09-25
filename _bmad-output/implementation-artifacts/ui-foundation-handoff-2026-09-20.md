---
status: planning-synchronized-readiness-passed
scope_revision: ui-foundation-2026-09-20
execution_resumed: false
stop_after_story: 1-7-durable-import-progress-and-restart-recovery
---

# UI范围交接

从CURRENT.md读取当前ui-foundation-2026-09-20 catalog/delivery、批准与定向readiness。Firefox128+/Safari16.4+、iOS16.4和Query/Router均已批准；不再按候选询问。新9.3–9.7分别承担组件、工作台/lint、浏览器保护、普通读取、导航，原业务Story保留页面与真实能力责任。

现行1.0/1.6/1.7/9.1实际合同已更新源hash、增量GWT、AR/UX及Tasks；历史7done不重开，旧2.2仍唯一映射暂停3.1。CODE-QUALITY等新增条件未自动verified；现有证据只证明其原来切片。

当前任务1.7仍资源阻断且完成后停止。本次范围同步不重启主任务、不得自动派发1.8或新UI Story。下一合同9.4及以后顺序已登记，恢复执行需要符合当时真实用户方向；guard支持记录新的停止点与受限窗口，不必为普通后续状态改写检查器。

平台配置已经同步并本地验证，见ui-foundation-dev-progress-2026-09-20.md与local-validation。运行native:sync走workspace脚本，勿绕过SPM校准。旧16.0勾选和APK是历史记录，真实最低版本/Mac签名/双端设备/TestFlight仍未验收。

实施准备时分别消费ui-foundation.md、frontend-data-navigation.md、ops/ui-validation.md；实际UI关闭需要ui_delivery_evidence及原APP-HOST实际证明。Query/Router需稳定9.3本地切片，不可用失败报告或backlog基础解锁。禁止把所有库与页面重构塞入一张Story。
