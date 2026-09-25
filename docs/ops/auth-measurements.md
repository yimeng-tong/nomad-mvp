# WL-AUTH v1：认证本地测量

Story1.0 T9/METRICS-01的独立实现。运行真实React App、LoginScreen、共享退出确认、认证API client和浏览器fetch；身份、短信、OTP、资格及退出响应由明确的浏览器HTTP拦截替身提供，外部请求全部拒绝。没有初始化PNVS/U-App、发短信或修改数据库；当前报告不代表真实认证、staging性能、SDK归因或双端设备验收。

## 执行与输出

```sh
pnpm run ci:auth-measurements
pnpm run ci:auth-measurements:negative
pnpm run measure:auth matrix
pnpm run measure:auth deadline-cutoff
pnpm run measure:auth-report /absolute/path/samples.json /absolute/path/recomputed.json
```

pnpm11直接在脚本名后传参数，不加会被原样转交的`--`。Runner独占127.0.0.1:5194，以每次随机nonce核对自己启动的Vite；端口已占用就失败，不进入已有服务。所有权请求与body读取共用250ms上限；反例可用AUTH_MEASUREMENT_PORT指定自有回环端口。Vite禁止读取本地env，API固定此回环路径；浏览器使用全新临时资料。默认产物在Git忽略的`.measurement-results/auth/<profile>-<runId>/`，也可指定`AUTH_MEASUREMENT_OUTPUT`的新目录；目录已存在即拒绝，不覆盖历史。报告CLI同样不覆盖已有输出，非法输入只返回固定错误码。

需要仓库固定Node/pnpm、Puppeteer Chromium和其系统库/中文字体；运行时版本来自report.provenance，不由开发配置冒充。CI会跑矩阵、截止、CLI重算和源合同测试，并保存实际样本/报告。该工具不进入产品入口或Web/native发布assets。

## 公共合同与来源

`packages/types/src/measurement-common.ts`定义共享单调窗口、采样率与nearest-rank分位数；原WL-IMPORT-DOCK消费同一实现，原导入字段与统计输出保持。每种能力保留自己的阶段字典，不能把FIFO展示时间换成认证或解析耗时。

`auth-measurements.ts`中的`nomad.auth.v1`严格约束WL-AUTH的manifest和样本。公共字段包括measurementVersion/workload/mode、clockId、scenarioPlan/plannedLogicalRequests、windowStartMs/windowEndMs/deadlineMs、fixtureVersion、sampling，以及明确concurrency/retryPolicy/cacheMode。当前fixture采样1、逻辑并发1，整个运行使用同一页面performance.now；逐case重挂App，模块和浏览器已热身。首次加载/Vite编译与填入首个合成手机号在窗口外，不叫冷启动性能。

runner记录Git基线、运行前后相同的源码/OpenAPI/lock/config SHA、workload源码hash、Node/OS/实际浏览器/viewport/CPU信息、UTC起止、实际HTTP写尝试数。未提交时Git只是基线，实际字节以sourceSha256为准。窗口包含诊断脚本与交互成本，没有独占CPU或仿真生产网络；小样本只用于工程回归。

样本只含独立随机测量UUID、固定scenario/outcome、时间/次数和原退出操作复用布尔结果；不保存手机号、OTP、服务端owner/session、operation_id、cookie、请求/响应正文或私人URL。原退出ID仅在探针内存比较，不能用测量ID认领业务身份。重算只输出校验后的manifest和统计，不回显任意provenance。

## 固定工作负载

| 场景 | 逻辑N | 可观察终点 |
| --- | ---: | --- |
| login | 3 | 明确发码、验码、当前/me成功，受保护首页可见 |
| send-rejected | 1 | 明确未发送，保留输入 |
| send-unknown | 1 | 发送未知提示，不当作已发送或已登录 |
| verify-rejected | 1 | AUTH_OTP_INVALID显示验证码错误；没有首页或自动重发 |
| restore | 1 | 重新挂载App，经/me读取后首页可见 |
| invalid-session | 1 | /me 401后回到登录入口 |
| authority-unavailable | 1 | /me 503后私有界面遮蔽、显示重试 |
| logout | 1 | 退出回执后再次/me，确认当前匿名界面 |
| logout-recovery | 1 | 首次响应未知，用户明确重试同operation；2次POST、1个逻辑动作，随后/me确认 |
| missing-terminal | 1 | 验码请求不返回，观察300ms后保留unfinished |

matrix总N=12，最多60秒，不为凑成功而延长。预期success6/rejected3/unknown1/unavailable1/unfinished1，实际写尝试15。具体响应由fixture源码冻结，数字是场景输入/完整性断言，不是产品成功率或延迟目标。

deadline-cutoff使用同一计划，250ms全局截止，首个发码响应延迟400ms。每次结束、App重挂和API投递都重新核对硬截止，不依赖timer已经获得调度；保留1个unfinished、11个未开始/缺失样本，只允许1次写入。以end<=start+deadline比较同一浮点端点，不通过加任意宽限来放行迟到结果。取消探针请求不宣称服务端事务取消，晚到结果不能补写完成样本。

任何场景准备、运行或完整性断言失败都先保存当前可取得的安全samples/report，再非零退出；run-status.json和report.provenance.runStatus标明failed。源码再次读取失败也保留样本，sourceReadable=false/sourceUnchanged=null，不能当通过。基础设施在采集前失败时只记录captureAvailable=false，不能伪造零样本成功。五个实际进程反例覆盖占用端口的悬空body、场景之间到期、隐藏首页、完整性失败和源码ENOENT；失败样本重新计算必须一致。测试专用AUTH_MEASUREMENT_TEST_FAULT只接受这四个具名故障，不进入产品配置，ENOENT来自新的探针目录，不删除真实源码。

## 阶段和统计边界

| 阶段 | 起点→终点 | 解读 |
| --- | --- | --- |
| otp-send | fetch开始→响应body读取完成 | sent与unknown/rejected分开；不是供应商实际发送或到达时间 |
| proof-verify | 验码HTTP请求→响应body读取完成 | HTTP接受不等于完成/me核验或进入首页；真实PNVS耗时未测 |
| identity-read | /me开始→响应body读取完成 | 当前合成身份/资格读取；退出后的401是预期匿名结果，需按场景读，不能当退出失败 |
| protected-home | 明确点击登录前，或恢复App前→首页/明确失败界面可见 | 登录等待主口径；失败/未知/未结束不进入成功池 |
| logout | 每个退出POST开始→响应body读取完成 | 原operation重试分开计attempt，未知不是成功 |
| logout-recovery | 用户明确重试前→当前身份核对后的登录界面 | 一个恢复动作，包含其退出请求与/me确认 |

每场景和每阶段单独输出N、P50/P95、结果分母、计划/观察/未观察case及实际attempt/retry数；空池null，按排序后ceil(p×N)取值，不平均P95。整体successElapsedMs是脚本工作负载总时间，可含合成输入操作，仅作附录；不要与protected-home的明确登录等待混为一项。

按逻辑ID和规范样本内容去重，冲突身份先隔离，observedLogicalRequests不含冲突；conflictingSamples保留它们。输入变体顺序不改变整体或分层结果，计划外变体也不能让冲突在场景过滤后消失。缺失/多余按各场景求和，不能用多跑login抵消漏跑restore。阶段缺失同样按各预期场景求和；unexpectedCases列出其他场景额外阶段，不能抵消缺失。非法字段、错误clock、窗口外/逆序、缺阶段、未结束均明确保留覆盖信息，不补0时长。阶段未观察可以表示未到达该步骤或漏事件，报告不自行猜原因。

未知成本/用量/route/model/prompt和服务内部阶段明确null/reason，没有“0元”。阶段时长来自单一客户端时钟，不和服务墙钟相减；真实服务/多实例/PG重启原证据由原认证probe承担，本工具没有重新证明它们。真实staging基线与费用、正式目标/取舍仍需1.0的METRICS-02和实际授权资源；T8第三方/许可/SDK/归因与T11真机责任不因测量工具完成而关闭。
