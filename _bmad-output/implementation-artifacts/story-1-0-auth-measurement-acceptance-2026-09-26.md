# Story1.0 WL-AUTH本地切片验收

结论：T9/METRICS-01的本地测量实现与T7/AC12验证码错误提示修复已通过当前提交完整CI及独立产物核验。1.0、METRICS-01和真实认证/归因/设备条件继续in-progress；本记录没有关闭整Story或真实staging性能。

受验提交0b9585ec4df4190562d20e932c5f994a5bbfe03c，[CI36192075867](https://github.com/yimeng-tong/nomad-mvp/actions/runs/36192075867)两个job均成功。证据在evidence/story-1-0-measurement-2026-09-26/ci-verification.json、downloaded-artifacts.json及ci/。GitHub实际产物997文件已下载逐项摘要登记，30个ZIP的CRC通过，15个唯一ZIP摘要。原预验和失败记录保留。

## 已交付

公共MeasurementWindow/nearest-rank统计实现由WL-AUTH与原WL-IMPORT-DOCK共用；原导入字段与统计语义保留，13项旧统计回归及15项原浏览器fixture重算一致。新工具在自有回环Vite上加载真实App/API client，通过显式HTTP替身分开发码、证明响应、/me读取、可见首页、退出及同操作恢复；来源文件、窗口、计划N、实际请求/重试和失败均可追溯。

LoginScreen原先把AUTH_OTP_INVALID统一说成会话失效；现在明确提示验证码不正确。输入保留、不自动重发、只有明确确认才再次验证的测试先失败后通过，真实浏览器拒绝场景通过。没有更改服务端身份、会话、幂等或凭据权威。

当前CLI正常报告和截止报告runStatus均passed、sourceReadable/sourceUnchanged均true。passed指相应测量断言成立；计划中的拒绝、未知和未结束没有变成业务成功。

| 当前CI计划 | 观察结果 | 实际请求 |
| --- | --- | --- |
| matrix：12逻辑场景 | 6success、3rejected、1unknown、1unavailable、1unfinished；0缺失 | 35 API、15写请求；其中退出恢复2次POST仍是同一operation |
| cutoff：同一12项计划，250ms窗口，首响应400ms | 1unfinished、11缺失；无伪造终态 | 1写请求，无后续场景投递 |

独立Acceptance审阅用提交内代码重算六份dataset，与原报告和matrix CLI输出完全一致；另独立核对nearest-rank与写入次数。六份报告各106个源码SHA，加故障verification的5个，共641次与该提交匹配，来源集合完整。

## 故障与审阅闭环

三层独立CR的9项问题均修补并由原审阅者定向关闭：浮点端点、timer迟到、截止后投递/挂载、所有权body超时、clock UUID、跨场景冲突与阶段覆盖、真实可见终点、失败样本保留，以及源码不可读时保存。详情见同名code-review记录。

| 实际故障回放 | 保留数据 | 结论 |
| --- | --- | --- |
| 端口被自有服务占用且body悬空 | 采集前失败；captureAvailable=false | 约692ms非零退出，没有伪造samples |
| 场景间准备耗尽5000ms窗口 | 1样本、11缺失、2写入 | 原成功样本保留，后续工作停止；runStatus=failed |
| 首页DOM存在但CSS隐藏 | 1未结束样本、成功耗时N=0 | 可见性断言拒绝；runStatus=failed |
| 完整性断言故障 | 12样本、15写入 | 完整数据仍保留并标failed |
| 实际ENOENT读取故障 | 12样本、15写入 | sourceReadable=false/sourceUnchanged=null，报告可重算；没有删除仓库源码 |

固定截止由每次动作/投递/终结重新核对单调时钟；两个实际harness函数体单测覆盖未调度timer时的迟到结果。冲突ID先隔离，各场景缺失独立求和，额外阶段不能抵消另一个场景缺事件。故障测试不以启动错误、零执行或删掉失败报告替代目标证明。

当前全CI还通过认证报告/CLI15、harness时钟2、旧导入报告13、移动266+5配置、99文件typed lint/零例外、6lint门禁、82handoff、32工作台+9网络、16工作台故障+2控制，以及原PG/认证/ingest/Redis/ACK/SSE链。native:sync/verify与Web/双端assets完整隔离通过。

原产品矩阵129项、33视觉和6项三引擎共享组件通过。基线没有更新，threshold0/maxDiffPixels0和无mask保持；额外Chromium V06捕获有2个边缘像素不同，原尺寸复核保留同一绿色焦点环和布局。记录中区分截图断言通过与附加PNG字节相等，没有把两者混为一项。

## 解释与仍未关闭的条件

CI中登录主口径protected-home为P50约38.1ms、P95约55.8ms、N=3；退出重试恢复约25.1ms、N=1。它们来自实际浏览器、已热身模块与合成HTTP，只有回归诊断价值；不包括真实PNVS、网络/设备、服务内部或短信到达，不支持真实性能目标。所有费用/用量与未执行的服务阶段保持null/reason，不填0元或推断真实成功率。

第三方登录接入平台/应用的非密位置已询问；正式法律、HTTPS、U-Link/SDK许可与缓存清理、匿名关联/真实查询、双端设备与生产恢复仍按原合同继续。没有真实供应商请求、SMS、共享数据变更或部署。9.3的本地gate与原生T9边界保持；3.1仍暂停。下一步继续近期计划第5步的在制独立代码，next_story_to_prepare仍1.8，不批量准备。
