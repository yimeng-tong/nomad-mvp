# Story 9.4验收与DoD记录

当前状态：整链CI等待中；不作为review/done凭据。源合同a120d2b064bfa7ba8a362f51aee771e61db8c04083817f7366250ae4d55adf27，实际开发基线abac3df，当前代码8ca552c。工具版本与本地验证见evidence/story-9-4-workbench-2026-09-25/{resolved-toolchain,local-validation,source-fingerprints}.json；历史失败逐次保留。

| AC | 实际实现与正例 | 会失败的反例与边界 |
| --- | --- | --- |
| 9.4-AC1 | 独立Storybook React/Vite入口；现有HomeSheet/LoginScreen共18场景；实际dev与static启动、干净clone冻结安装、正常/空/长中文/200%/loading/禁用/错误/重连 | 未配置供应商可运行；真实provider配置在工作台启动被拒绝；使用未来9.3能力和真实账号不是先决条件 |
| 9.4-AC2 | 浏览器与Node共用生成DTO handlers；scope/ready/cleanup隔离，Node网络9项；403/partial/真实abort/重连 | 16故障含未知/被catch/旧scope晚到/raw静态/Accept旁路/worker丢失或停用及其竞态；每个故障须非零失败且哨兵不泄露 |
| 9.4-AC3 | 实际ESLint flat/typescript-eslint/Hooks/a11y，TSProgram覆盖永久cohort和基线后新改文件 | 同门禁6组测试包含Promise/void/Hook/label、JSX、Node globals、新增/重命名、浅克隆/缺失base、ignore/规则关闭/parse/冻结基线；修正对照通过 |
| 9.4-AC4 | 精确锁包及strict peer干净安装；同主版本Vitest安全patch有D3记录；旧诊断冻结，当前保留豁免0 | 不允许增加/移动/替换豁免；继承依赖audit告警保留，不宣称全仓无漏洞；Redis退出为已定位CI阻断窄修复，不更改认证/日志/租约 |
| 9.4-AC5 | 真实Chromium组件play/axe；390px、reduced-motion、computed字体200%、焦点/键盘/错误和非颜色文字 | 焦点返回/键盘关闭/错误关联/文字缺失/axe缺陷均实测失败；自动检查不代表VoiceOver/TalkBack或设备 |
| 9.4-AC6 | 实际产品模块图与writeBundle最终资源bytes绑定；双端完整资源清单、原production transport；干净origin无产品SW和外网 | 5组污染检查含public/入口/native额外worker、源码变更及同名Web/native产物篡改；Web构建与native sync/verify不代表APK/iOS/TestFlight |

## 原责任与独立审阅

原类型/build/handoff/82回归、auth/ingest/备份/进程、真实隔离PG、mobile及旧合同/synthetic/SSE保持，实际CI入口与未全部纳入的IDB/双tab/原生/生产恢复责任列在docs/ops/ui-validation.md。工作台不关闭1.0/1.6/1.7/9.1的真实证据，也不解除3.1暂停。

三层独立CR首轮13项已全部修复复核；后续CI窄修补分别独立审阅，Redis补充R14已修复且Edge复核[]。最终验收审计与远端整链仍待收取。完整发现与复核见story-9-4-code-review-2026-09-25.md。

## 当前关闭待办

- 收取8ca552c实际完整CI、产物及源码绑定记录。
- 保存逐条件ui_delivery_evidence，T6/T7逐项完成后更新review/done与CURRENT/Sprint，ci:handoff通过。
- 最终File List包含相对abac3df的全部新增、修改、删除文件；保留历史准备清单为历史。
