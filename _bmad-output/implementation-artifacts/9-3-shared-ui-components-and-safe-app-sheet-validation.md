# Story9.3 准备验证

Status: passed / ready-for-dev
Date: 2026-09-26
Scope: current source contract and implementation readiness only

8组源GWT、叙事、Requirements与依赖范围保真，source hash1068161ce8180a56148f85f34f668ba8d5451ff2d4dd6c818fad26bbbf68e323；7 FR/NFR、5工程条件和shared-ui-adoption已进入实际Tasks。9.4/9.5已done，9.5关闭提交775b132的CI36160339430再次通过；当前分支codex/story-9-3-shared-ui，主任务唯一writer。

两份独立VS及修补复核通过：research/story-9-3-contract-review-2026-09-26.md与story-9-3-plan-review-2026-09-26.md。真实原生生命周期、共享模态相对legacy返回优先级、Home Tabs实际消费点三项均明确，无准备阻断项。

技术及集成研究明确Base UI受控Dialog、身份DOM内Portal、activity隔离、异步关闭和实际遮挡时长；Tailwind不引入Preflight，保留原视觉及业务权威。包版本为精确候选，准备期间未安装/实现/运行产品验收。固定canonical CI仍为三引擎像素基准；最低平台与真实设备另外验收。

五条件保持not-started。APP-HOST-01/AC6缺真实设备时整张9.3不能done；符合实际证据的local-ui-regression只解锁后续9.6/9.7本地依赖。当前只准备9.3，next_story_to_prepare为1.8，不提前批量准备。3.1暂停、历史done、既有资源与原生门槛保留。

输入摘要为evidence/story-9-3-preparation-2026-09-26/input-manifest.json，记录准备开始时源文件与代码，跟踪文件后续状态更新不重写该历史摘要。状态同步后交接检查见同目录/preparation-checks.json。未更改checker或产品，状态变更无需新产品测试；按持续授权继续DS。
