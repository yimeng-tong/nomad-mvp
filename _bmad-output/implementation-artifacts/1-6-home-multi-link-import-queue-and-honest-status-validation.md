# Story 1.6 准备复核（2026-09-19）

结论：实施合同准备通过，可继续本地/隔离开发。不是Story或真实服务/App交付完成。

- 正式源：epics.md Story1.6，11组GWT（9组原业务＋C05/C06）。
- Catalog：sprint-migration-2026-09-19.yaml.story_catalog；源摘要`41e1f19dc0148488e93e2cd6a4e4f34f06807a96c6a3fbfc1c22a1ce845e112d`。
- 源Requirements保持逐字；delivery的FR14/FR49/NFR6与input-attribution追加到实际Tasks，不丢源NFR2。
- 6项工程条件OPS-01/DB-CHANGE-01/METRICS-01/02/03/APP-HOST-01有本Story开始/关闭、责任与证据任务。
- 已读既有Home/ingest源码与相关原型、架构/UX/PRD、历史1.5、新1.0/9.1、近期Git以及官方Clipboard/SSE文档，保留框架/安全边界。

独立准备复核：

1. UX/前端复核核对11组GWT、绑定/来源/引用、单一Dock、完整10秒、导航保留、早期深链inbox、主动粘贴与本Story双端证据，通过且无必须修正项。
2. 后端复核确认快照/disposition/原job retry/真实partial/fixture隔离与1.7/1.8边界；提出3项修正，均已落T1/T4和验证矩阵：同attempt单调state_version；服务端明确终态/资格/retry准入与幂等关联；已保存partial在重试再失败后保留，缺失字段不等于删除。

复核由本任务分离的AI分析步骤执行，不声称有人类验收。后端完整读取与依据见`research/story-1-6-backend-context-2026-09-19.md`。真实服务配置、U-Link/U-App、双端设备/Mac与1.0正式协议/登录证据仍未关闭；已提供资源不重复列为缺失。无常规产品决定需要再批准，实施技术选择继续记录。

状态推进：1.6 backlog→ready-for-dev；next_story_to_prepare→1.7。1.0/9.1保持in-progress，3.1保持paused，历史7张done及旧Epic1回顾不变。完整handoff与diff检查由主任务在保存后执行，失败须修正，不以本报告替代检查结果。

保存后实际检查：`node scripts/check-handoff.mjs`和`git diff --check`通过（9/62/1052；7 done/3 in-progress/1 ready/51 backlog；next1.7）。没有改动guard规则来迁就新状态。
