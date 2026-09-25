# WL-AUTH独立切片三层审阅

Status: patches-rechecked-current-ci-pending
Baseline: dd2a9700109425d2e80751e3ab4bf419c230af0f
Scope: Story1.0 T9/METRICS-01本地测量与T7/AC12验证码错误提示修复；整Story仍in-progress

按bmad-code-review执行，customization无额外步骤。937行源码/配置/测试/操作说明diff，三个fresh-context子代理使用当前模型能力；Blind只收到diff与技能，Edge可只读代码，Acceptance收到Story/工程前置和测量文档。主任务保持唯一writer。三层均完成有效审阅，归并8项patch，0decision-needed、0defer；此前没有将此切片或真实认证标完成。

| ID | 来源 | 已证实问题 |
| --- | --- | --- |
| AM1 | Blind | start1000.4+deadline250再相减可得250.0000000000001，合法截止窗口被validator拒绝 |
| AM2 | Blind + Edge +主任务 | timer迟到时finishCase可把过期success裁进窗口；停止采集后fetch仍能投递新API、mount无截止门禁 |
| AM3 | Blind | nonce fetch/body无超时，占用端口可令所有权预检永久挂起 |
| AM4 | Blind | manifest允许UUIDv1–v8，但samples只允许v4，合法manifest可导致样本全拒绝 |
| AM5 | Acceptance | conflict的第一条scenario决定overall分母；只换输入顺序就改变missing/extra，分层却不变 |
| AM6 | Edge | login缺proof，restore多出proof，会把overall阶段缺失冲成0 |
| AM7 | Edge | 默认waitForSelector只需DOM存在，未证明首页真正可见 |
| AM8 | Edge + Acceptance | 准备/重挂中的截止和场景/断言失败跳过finishRun与写文件，已观察样本消失 |
| AM9 | Blind复核 | preserve先hash再写samples；源码被删除/重命名或不可读时，失败路径再次hash导致已采样数据仍未保存 |

各项写入Story Review Findings。既有持续实现/修补授权适用于全部patch，继续修补无需新的动作批准；真实资源门槛独立，技能通用“审阅通过→done”不适用于整个1.0。本轮只会记相应局部证据。


## 修补与定向复核

AM1–AM8已分别获原审阅者关闭；Blind复核新增AM9也已修补并关闭，无剩余问题。原源码时钟单测2、认证统计/CLI15及旧导入统计13共30通过；全mobile266+5配置、99 typed lint/零例外和6lint门禁反例通过。五个实际进程故障回放通过：占用端口悬空body约1.4秒拒绝，跨场景截止/隐藏首页各保留1样本，完整性失败/实际ENOENT各保留12，均failed且当前代码重算一致。正常12和截止1/11样本预验保留其当时hash，最后AM9只改runner失败保留；等待当前提交完整CI重新验证最终全部源。
