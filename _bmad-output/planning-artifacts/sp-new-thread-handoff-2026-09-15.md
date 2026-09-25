接续 Nomad，直接运行并完成 BMAD Sprint Planning。你就是用户要求的新对话接收方，不要再创建另一个对话，也无需读取旧聊天记录。

用户已明确批准：CE完成、九项IR整改、独立18组提示呈现方案；无其他规划前置时进入SP。当前规划已经过定向复验，可以进入SP。新对话要求模型 gpt-6-astra、思考强度 max；这已由创建参数设置。为接上全部尚未提交的规划文件，本任务沿用当前保存项目目录 /home/tong123/work/nomad-mvp，使用WSL Ubuntu及WSL Node/pnpm。

先读 CURRENT.md（已精简为84行），按它的顺序读取 project-context、旧sprint-status、旧2.2实施Story、最新 implementation-readiness-sp-handoff-2026-09-15.md、唯一正式 epics.md 和 implementation-prerequisites-2026-09-15.md。再加载 .agents/skills/bmad-sprint-planning/SKILL.md、解析customization并执行。不要把同目录的*epic*覆盖报告、拆分提案或归档重复算作Story。

当前8个Epic、60张Story（7历史/53目标）、1018组GWT、65条FR/24条NFR。新1.0生产认证前置，1.11手工地点纠错、5.1最小S10/S9/来源/返回和全部18组提示采用已落实。此为规划通过，实际功能仍未实现；不要重开已批准的产品取舍或为了SP先生成所有原型。

完成SP时特别处理：
1. 先留存原sprint-status及范围说明。旧epic-1: done只覆盖历史1.1–1.5；重算扩围后当前Epic1的状态，不能把新增1.0/1.6–1.11当done，也不能丢七张历史Story/已完成回顾的事实。
2. 旧2-2-timeline-editing-undo-and-history只迁入新3.1一个执行身份，保留legacy_story_id、baseline_commit 10f940c49e2d61ddcb1233cffddd071ed1c9284c和codex/story-2-2-timeline-editing的Git历史。继承在制事实与新合同准备分开；不要同时派发旧2.2和新3.1，不因旧文件存在就把新规格自动标ready。
3. 新1.0是首个新增执行准备；旧在制编辑仍应按前置条件暂停。OPS-01/OPS-02/DB-CHANGE-01/DATA-VECTOR-01/METRICS-01/02/03挂到所属任务或开始/关闭条件，不创建七张额外产品Story。延期7.2/8.7/8.8及其他旧草稿不进本期可执行队列。
4. 新旧Story使用明确、唯一的slug/迁移映射，保持历史键；生成完整合法YAML，核对60张Story、8个Epic/回顾、状态合法、无重复遗漏。历史来源、延期与迁移信息可用额外元数据/档案保存，不能发明development_status非法状态。
5. 同步CURRENT、迁移说明和scripts/check-handoff.mjs到新的Sprint状态。旧脚本对旧2.2/2.3等键的断言需转成正确的当前/历史校验，不是删除安全检查。运行文档/YAML/迁移/交接必要检查后报告结果与下一张待准备Story。

用户本次授权到SP完成及必要跟踪/交接更新，不自动开始create-story/dev、真实模型/外发、部署、采购或数据操作。不要reset/clean当前工作区或覆盖既有未提交内容。父对话在派发前已完成写入；从这里由你维护SP状态。
