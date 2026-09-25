# Story1.7 受控 homelab 服务端补读基线

证据为 VM104 实际PG16.15和staging模式独立服务进程，数据/Session颁发是合成fixture；HTTP仅loopback并使用明确trusted-proxy测试头。不是现有公开部署或真实Provider基线，不证明客户端durable ACK、公共TLS或产品指标已批准。

固定workload `WL-RECOVERY-SERVER / homelab-loopback-v1`：每job152事件，4个variant各重复3次，串行并发1，计划/观测N=12全部通过，cleanupComplete=true。源码是runner传输后UTF8/LF的实际字节摘要；本机文本规范化后逐项验证全部匹配，Git基线另存，不能用Git HEAD代替未提交工作树的运行版本。

| 场景 | N | 首业务帧P95 ms | completeP95 ms | 重启启动P95 ms |
| --- | ---: | ---: | ---: | ---: |
| 全量补读152事件 | 3 | 130.6 | 3203.7 | — |
| 尾部补读10事件 | 3 | 27.1 | 225.0 | — |
| 终态head确认，无业务事件 | 3 | — | 33.8 | — |
| 重启后补读52事件 | 3 | 104.8 | 1171.5 | 620.5 |

分位数使用nearest-rank且仅纳入passed样本；terminal-head无业务事件，首帧分位数是null，不填零。completeMs从HTTP请求开始算，**不含服务重启**；serverStartMs单列SIGKILL至新进程监听完成。所有相减均在同一个父进程performance.now时钟内，wall-clock窗口仅作归因。小样本、同机loopback、未隔离其他服务，不可据此宣称生产SLA或跨网络体验；usage/cost未知null。

报告：`evidence/story-1-7-measurement-2026-09-19/server-baseline.json`。原15请求WL-IMPORT及客户端压力矩阵仍单独存放，不合并分母。旧探索报告另存before-provenance-fields，最终采用严格修补后重跑。

审阅修补了探针的错误成功和失败证据路径：坏尾帧/超限/超时明确失败并要求自然EOF，done不产生未处理拒绝；失败保留已有事件数/首帧/启动时间和完整plan/clock/source/environment/coverage；SIGTERM停止有期限及SIGKILL后备，远程runner使用独立进程组清理所有继承后代，再报告退出/超时。4个真实HTTP reader反例、2个本地进程组反例通过；三层只读复核关闭。远程外层270秒覆盖schema生成、180秒probe和清理，短probe使用150秒外层。

实际产品负载的指标基线、yimeng-tong版本化体验/费用目标及生产候选比较仍未齐备。此报告推进METRICS-01/02的本Story基础证据，不解除生产/真实适配器/设备门槛。新备份目标问题已提出，当前仍等待资源输入，不进入1.8。
