# UI实施前置与逐Story证据

Updated: 2026-09-20
Scope: ui-foundation-2026-09-20

## UI-COMPONENT-01

首次责任：Story9.3；执行/验证：Codex。

触发：共享组件消费与私有Portal/宿主行为。

开始：正式合同、批准执行窗口和适用先前工作台/本地切片。

关闭：实际消费与本Story状态/身份/平台回归；真实native证据独立；实际Tasks落实，condition_progress逐Story记录not-started/in-progress/verified/not-applicable，后两者需summary和现存证据。首交付owner不得以not-applicable豁免核心责任。

## UI-WORKBENCH-01

首次责任：Story9.4；执行/验证：Codex。

触发：新改UI有可重现状态与交互示例。

开始：正式合同、批准执行窗口和适用先前工作台/本地切片。

关闭：可运行示例/a11y、替身隔离和当前源码证据；实际Tasks落实，condition_progress逐Story记录not-started/in-progress/verified/not-applicable，后两者需summary和现存证据。首交付owner不得以not-applicable豁免核心责任。

## CODE-QUALITY-01

首次责任：Story9.4；执行/验证：Codex。

触发：新增/修改的TypeScript与React源代码。

开始：正式合同、批准执行窗口和适用先前工作台/本地切片。

关闭：真实typed lint及失败负例，历史例外不增长；实际Tasks落实，condition_progress逐Story记录not-started/in-progress/verified/not-applicable，后两者需summary和现存证据。首交付owner不得以not-applicable豁免核心责任。

## UI-BROWSER-01

首次责任：Story9.5；执行/验证：Codex。

触发：UI或实际render/恢复行为变更。

开始：正式合同、批准执行窗口和适用先前工作台/本地切片。

关闭：当前浏览器/截图与原探针对照；不以fixture替代native；实际Tasks落实，condition_progress逐Story记录not-started/in-progress/verified/not-applicable，后两者需summary和现存证据。首交付owner不得以not-applicable豁免核心责任。

## 证据格式与真实门槛

UI关闭引用ui_delivery_evidence YAML：kind=ui-verification，story_id、source_contract_sha256、source_revision、recorded_at及checks。每个条件记录result=passed/not-applicable、environment、summary、现存evidence数组。它不替代app_delivery_evidence kind=real-runtime及实际安装/TestFlight。

9.6/9.7开始前核对9.3的shared-ui-local-regression-passed切片，scope_local_slice_progress记录源码和现存证据；无需把整张native完成作为普通读取代码的循环前置，原生关闭门槛保持。


## 执行窗口与本地切片证明

后续恢复记录必须明确stop_after_story（无后续停止为null）、allowed_story_keys、真实user_request/recorded_at，且允许集合不能越过新停止点。未开始的backlog/ready-for-dev不得仅靠CURRENT留在旧任务就偷偷启动。文件仅记录实际用户方向。

local-ui-regression证据必须result=passed，checks为非空且逐项passed；9.3至少已in-progress、有实际合同。9.3/9.5/9.6/9.7开始时须具备自身已交付的workbench/browser依赖；普通读取/导航仅需9.3实际可用的本地切片，不将本地证据变成9.3整张native关闭。
