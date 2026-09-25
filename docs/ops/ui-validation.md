# UI组件、浏览器与CI验证合同

Updated: 2026-09-20
Status: approved-target; 9.4/9.5 implementation pending

交付一个可运行的组件状态工作台，先覆盖已有 HomeSheet/字段，再由 9.3 补共享组件示例。每个核心组件至少有正常、加载、禁用/原因、错误/重连、长中文、200% 字号、键盘、reduced-motion 与身份未确认场景；复杂组合补 empty/partial/stale。Storybook 展示用例不是 BMAD Story 状态。

MSW handlers 对齐生成 API 类型及现有安全错误，浏览器/Node 测试复用；未处理请求默认失败，静态资源允许清单明确。独立入口/构建产物中才启用，正式 Web/Capacitor build 无 mock worker/自动注册及相关启动分支；不让 MSW 改写真实 native transport 或替代 PG/设备验证。组件工作台不加载真实生产密钥，不上传用户数据，也不默认公开发布。

用 ESLint flat config + typescript-eslint 类型规则 + Hooks + JSX a11y 替换占位 `ci:lint`，CI 实际调用且失败阻止通过。初始覆盖新共享层、工具配置和迁移涉及的实际源文件；既有问题按文件/规则/原因形成冻结清单，只减不增，不能整目录关闭规则或用 `|| true` 掩盖结果。选择 no-floating-promises/no-misused-promises、必要 unsafe 类型、Hooks 与 label/交互语义规则；不要因修 lint 改写业务状态机。负向样例必须证明未处理 Promise、错误 Hooks 和缺失 label 会失败。[类型检查规则](https://typescript-eslint.io/getting-started/)

## Playwright与日常CI

保留 Puppeteer 旧探针，先建场景对应表，证明等价覆盖后才退役重复脚本。首批：登录→Home→Settings→返回；Sheet 打开关闭/焦点/滚动；输入错误、loading/empty/partial/reconnect；身份变更遮蔽 portal；Home FIFO/操作回执不重发；长中文和大字号。现有 operation journal 的真实 IDB/双 tab/跨进程、1.7 的 PG/真实 SIGKILL/SSE 探针按原责任保留。

固定 Linux 镜像、Playwright/browser revision、字体、locale、timezone、viewport、DPR、时钟、数据及动画策略；截图按引擎独立基线。CI 输出 actual/expected/diff 和 trace，基线更新是显式审阅动作，不自动接受 diff。Chromium/Firefox/WebKit 流程至少都有身份与弹层覆盖；浏览器自动化不代替真机、最低特定浏览器或供应商实证。

| 层次 | 必须保留/加入的检查 | 不得替代的证据 |
| --- | --- | --- |
| 每次改动 | 生成类型及漂移、实际 typecheck/lint、handoff、单元/组件、受影响 Storybook interaction/a11y、构建 | 真实接口/原生能力 |
| 合并前 | 上述检查 + 关键浏览器与截图、受影响 PG 事务/迁移/恢复/真实 socket 探针 | 供应商与真机 |
| 发布前 | 明确候选源码/资源摘要 + 最低/当前平台真机、真实服务、签名/升级/APK/TestFlight | mock、模拟器、仅构建或上传受理 |

CI 清单逐一标注现有认证/ingest probes、home-dock/auth/journal/telemetry browser probes、measurements、1.7 event/lease/worker/replay/SSE/ACK。哪些已在 CI、哪些仍独立、哪些需隔离资源，都写入交付证据。不要把提案里的目标清单说成现在已执行。

## 当前证据边界

当前ci:lint仍是占位，产品尚未安装Storybook/MSW/Playwright/共享UI；本文不声明工具已接入。已有types/handoff/build/auth/ingest/PG/mobile及旧合同探针保留。实施9.4/9.5时必须逐脚本核对现行CI和实际执行结果，记录替代/保留原因。真实auth/供应商/native设备仍由原责任Story验收，代码/配置检查不代替。
