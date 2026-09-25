# Story9.3 本地UI切片验收

结论：shared-ui-local-regression-passed已满足；四项UI工程条件仅在本Story范围verified。9.3仍in-progress，APP-HOST-01、真实AC6及T9未关闭，不能标整张review/done。源合同SHA为1068161ce8180a56148f85f34f668ba8d5451ff2d4dd6c818fad26bbbf68e323。

最终受验代码aeadc1e79e1243c942b3db0216b945174eca0256的[完整CI36184294356](https://github.com/yimeng-tong/nomad-mvp/actions/runs/36184294356)两个job均成功。报告、校验与下载摘要在evidence/story-9-3-ui-2026-09-26/{ci-verification-final,downloaded-artifacts-final}.json及ci-final/；26dab0a的完整CI与更早失败均独立保留。随后关闭记录只改文档/状态/证据，不改变受验产品和工具源码。

## GWT与证据范围

| AC | 本地结论与直接证据 | 未被本次关闭的范围 |
| --- | --- | --- |
| AC1 | 固定Base UI1.8.0、Tailwind4.3.3、shadcn4.21.0与8份registry原响应/MIT/hash；Nomad tokens、无Preflight、真实Login/Home/退出迁移。dependency-and-foundation、token-contrast、provenance及33视觉证明 | 真实最低平台见AC6 |
| AC2 | Button默认非submit、Field关联、输入保留、实际Enter/229组合防护及反例，工作台32场景；loading/empty/error/reconnect/partial/stale/unverified分明，无自动剪贴板 | 真实屏幕阅读器/原生键盘见T9 |
| AC3 | B05/B23/B29/B31实际Portal、双向焦点、滚动/背景、恢复与动画中checking；组件生命周期/StrictMode、取消与失效promise反例；三引擎补充隐式trigger恢复 | 真机系统焦点/进程重建见T9 |
| AC4 | 所有关闭入口使用同一gate；现有host协调器优先级和单层消费测试；B08准备中关闭仍只有原确认的一次POST；normal/reduced-motion分别验证 | Android真实键盘/系统返回没有用模拟host或viewport变化替代 |
| AC5 | B13–B18/B23/B25/B29验证实际私有DOM、owner/session与迟到读取/关闭；3引擎×2实际共享组件场景补checking/unavailable、Toast旧回调、换session/owner和隐式focus | Toast场景是隔离组件harness，不是新增业务通知入口；原生后台屏幕/进程见T9 |
| AC6 | 当前三引擎的200%/reduced-motion、320px窄屏/1280px桌面、44px/完整CTA、焦点实测4.896366:1和3px通过 | **未验收**最低iOS16.4/真实Android与iPhone、VoiceOver/TalkBack、真实键盘与系统栏 |
| AC7 | B07真实11秒覆盖及退出期间暂停、剩余可见窗口和不重播；B08真实crypto；原PG/SSE/IDB6探针含SIGKILL/3进程/原cursor与跨owner、零新增ingest POST；controller/journal不改 | 原压力/遥测/生产PITR未在此重跑；真实设备恢复仍由1.6/1.7承担 |
| AC8 | 三层CR四项修补、CI两项真实缺陷修补及复核，当前全CI/源码/lock/config/构建bytes绑定；API/兼容责任/逐适配Git回退明确，四张在制Story影响记录完成 | 适用native与整张Story关闭仍需T9；其他Story不自动done |

## 当前执行结果

- canonical使用固定noble/amd64 Playwright1.63.0镜像、Node22.22.1/pnpm11.7.0、48字体。实际Chromium153.0.8010.12、Firefox155、WebKit26.6；环境指纹7a174c57a759784e37a22d2c3cf4943c57b70bb22bcfd938b0ce11d6be8e9c0b。
- 129产品场景：32流程+11视觉×3引擎，0skip、0retry。v2验证303源码输入、220构建模块/52本地模块、实际HTML/assets与逐PNG。当前33张附加actual PNG的摘要均与批准基线相同；截图断言保持threshold0/maxDiffPixels0，没有mask或auto-update。
- 6项三引擎共享组件场景独立记录于ci-final/shared-ui-matrix/，每引擎真实执行2条且观察UA核对驱动。其源码、配置、runner也在当前303输入绑定内。本机错误engine标记负例两条实际失败，见shared-ui-matrix-preflight.json。
- typed lint88文件、零例外；工作台32浏览器场景+9网络测试、16故障+2正控；移动265+5原生配置；handoff82、lint门禁6、产物隔离7反例；完整构建、native:sync/verify及Web/Android/iOS完整资源检查通过。未把同步/编译写成真机通过。
- 浏览器5网络负例/2正控、7产品负例/12控制场景、4报告完整性和5构建绑定负例、4验证配置负例/2视觉正控均执行通过。CTA移位actual/expected/diff与已原尺寸审阅的26dab0a对应三图逐字节一致；这次不重复挑选新baseline。
- 实际下载970文件，30个ZIP CRC全部通过（15唯一摘要）。raw日志只保留临时目录并记录摘要，未把日志/构建输出放入Git。
- 原认证6、PG/SSE/IDB6定向回放的范围、6e0b973到当前只变focus CSS的事实与28份历史证据保护见story-9-3-integration-impact-2026-09-26.md。未发真实供应商请求或SMS。

## 失败记录与关闭责任

候选36172229448拒绝：Chromium窄屏关闭按钮越界0.40625px；scroll-padding16px修复，保留ratio1。候选36176188637虽33用例通过，原尺寸审阅发现旧粉色focus对比1.494756，拒绝发布；换批准深绿并新增实际对比/弱focus负例。候选36178891862通过来源、环境、实际viewport及逐图审阅后才发布33基线。734efb7/run36180484033的browser通过但core因规划源镜像遗漏失败，26dab0a同步镜像后完整通过；本次aeadc1e再验证全部链与新增6场景。未删除失败或放宽阈值。

可消费证明是ui-delivery.yaml和local-ui-regression.yaml；后者仅满足9.6/9.7的局部前置，队列仍按near-term-development-plan执行，不立即越序启动。真实设备/最低版本/权限适用性逐项见story-9-3-native-gates-2026-09-26.md。1.0/1.6/1.7/9.1及3.1原状态与门槛保持。
