# 首次消费事件字典与许可边界 v1

此文记录Story1.0 T8/1.6 T6的客户端安全实现，补足`analytics.md`要求的值级allowlist。
不是友盟SDK安装、设备运行、实际归因/控制台查询或Story8.1完成证明。

## 实现与当前接线

`apps/mobile/src/telemetry/dictionary.ts`是nomad.telemetry.v1机器字典：每个允许事件有stage、client emitter、事实边界、字段规则和必要字段。
登录/设置是独立表面，stage为null，不冒充S0-S11中的业务步骤。Home为S0、导入为S1；兼容规划/编辑事件的边界明确带legacy，不能当新MVP聚合完成。
`auth/analytics.ts`的trackAnalytics已接入Login/Home/Planner/DayPlan/Settings每个既有页面出口。
运行时未知事件、原型名称和超32字段对象拒绝；只读取允许字段的自身数据属性，不调用getter或字符串转换。
枚举精确匹配，计数仅0–10000安全整数（attempt/完成保存数要求正数）；任意错误文本、嵌套对象、URL、ID、city/date/pace/luggage内容不通过。

历史HQ/seed-adoption/BYOK事件停用；原邮件打开事件feedback_submit_success也停用，因为打开外部邮件不能证明收件或首方已存储。
既有编辑操作本身和UI恢复不变，3.1仍暂停；只对遥测出口去掉私人plan/slot/day_delta和废弃seed事件。真实错误码来自有限枚举，未知错误不把原文当新类别。
规范input/import事件有字典条目，但尚未新增真实发射器；字典存在不证明某事件已经采集。

`telemetry/runtime.ts`提供待SDK适配器消费的许可生命周期：

- requiredPolicyVersion与sink初始化方法在构造时固定，必须是该版本的granted，且身份阶段为anonymous/authenticated；unknown/denied/checking/unavailable均不初始化、不缓存待补同意事件。
- bind捕获上下文代次；撤回、许可版本变化、owner/session的authEpoch变化、暂停与恢复都使旧bound emitter失效。不能把旧异步回调自动关联到新owner。
- 同一时间最多一个initialize/send；队列最多64，30秒TTL，事件ID去重最多1024条/5分钟；TTL使用单调时钟，在实际send微任务前复核，墙钟仅作事件时间戳。默认事件ID随机UUIDv4，重放调用方可显式提供稳定的安全UUIDv4（规范化小写，不接受携带节点标识的旧UUID）；未持久化，不声称跨进程供应商去重。
- 初始化2秒、发送/清理1秒截止；结果仍不确定时锁定failed，不继续叠加请求或重新初始化共享SDK。迟到的初始化句柄关闭一次；没有原始磁盘spool或自动重试。
- 每次实际send前重新校验白名单并冻结信封；只带版本、随机/显式安全eventId、时间、stage、host和安全属性，不带owner/session/手机号/渠道URL。
- 许可改变立即abort并丢弃队列，先完成旧session.close再允许新初始化；清理超时保持failed。计数区分SDK accepted/rejected、blocked/invalid/duplicate/overflow/expired/abandoned/failed。
- SDK accepted永不等于可查询、真实业务成功或删除完成。已在撤回前发出的请求不能撤销；适配器还必须在真实SDK调用处检查signal，并停止/清除自己的缓冲和自动采集。

当前App默认仍是未连接的Noop，runtime尚未绑定真实SDK、持久许可UI或供应商账号关联；这正是剩余接入任务，不能以此关闭login-attribution/input-attribution。
不向当前用户隐式授权或请求新密钥。所需正式法律正文、U-Link域名/Scheme和真机资源问题已提出。

## 供应商核验依据（2026-09-19）

- [Android集成流程](https://devs.umeng.com/docs/119267/detail/118584)：common/asms是基础依赖，uyumao/abtest是额外可选能力；接入时固定经核验的版本，不使用动态`+`。
- [Android SDK配置指引](https://devs.umeng.com/docs/119267/detail/210108)：基础SDK仍有设备标识处理，不能把手工事件属性脱敏等同整个SDK没有采集；可选位置/应用列表等不自动加入。
- [账号统计](https://devs.umeng.com/docs/119267/detail/118637)：账号关联与登出有独立接口，控制台账号报表开关不等于是否计算数据；不得直接填Nomad原始owner/手机号作为供应商账号标识。

下一步须检查实际固定SDK版本的初始化/停止/自动采集行为，落实原生的许可与generation检查，再消费本runtime；Web/PWA、Android与iOS能力及真实查询分别验收。未确定的Web能力不能默认为原生U-App已覆盖。
