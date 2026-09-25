---
project: nomad-mvp
date: '2026-09-25'
status: execution-handoff
scope_revision: ui-foundation-2026-09-20
authorization_record: _bmad-output/implementation-artifacts/sprint-execution-resume-2026-09-25.md
preparation_policy: just-in-time
first_story: 9-4-component-workbench-and-enforced-code-quality
next_story_to_prepare: 9-5-browser-flow-and-visual-regression-gates
single_writer: true
new_task_id: pending
git_checkpoint_before_story_9_4: true
development_hosts: [wsl, macos]
backend_environment: homelab-vm104
---

# 近期开发顺序与在制工作交接

## 当前决定

用户明确解除原1.7完成后停止边界，并把全量准备改为按近期开发顺序滚动CS/VS。先执行已经准备完的9.4；9.5、9.3在各自即将实施时再正式准备和独立验证。其余backlog保留，17份尚未验证草稿归档为研究，不计ready。

当前正式范围未变：67 Story / 1089 GWT / 66 FR / 25 NFR；7 done、5 in-progress（含暂停3.1）、1 ready（9.4）、54 backlog。源Epics、ui-foundation-2026-09-20 catalog/delivery、旧批准与历史done不重写。此文安排当前执行，不改变产品业务合同。

## 在制Story：复用、剩余、依赖

| Story | 当前可复用内容 | 真实剩余责任 | 新UI依赖与处理 |
| --- | --- | --- | --- |
| 1.0 生产认证 | 持久owner/session、PNVS适配与运行边界、route/owner/CSRF/SSE/退出隔离、native transport、最小operator授权已落地；Task未勾选不代表全未写 | 真实HTTPS/PNVS受限联调、正式协议资源；适用已批准Apple/微信方式及冷暖回调仍有实现工作，不能全归为设备缺项；U-App/U-Link、许可/匿名关联/真实查询及设备证据；生产恢复和目标条件 | 9.4真实lint，9.5登录/身份基线，9.3登录/退出共享组件；同一变更由1.0补本领域证据，9.3通过不自动done |
| 1.6 输入/队列 | Dock、快照/幂等受理/partial、FIFO、加密operation journal、输入深链/主动粘贴基础及测量/隐私字典已落地，1.7补持久事件恢复 | App默认Noop仍不是真实归因；规范input/import事件、许可UI/SDK适配/匿名绑定与清理、真实U-Link配置/事件查询和设备矩阵；disable后SDK残留需真实策略闭环 | 9.3共享HomeSheet/输入迁移，补FIFO可见窗口、owner变化、未知回执回归；不重做journal |
| 1.7 持久恢复 | T0–T4及客户端IDB durable ACK/CAS/有界消费、真实PG/SSE/跨进程与隔离恢复已完成；本轮76份封存源码hash与当前树一致 | T5原生bridge实际恢复、T6可访问设备交互、T7双端C07/iOS构建、T8生产备份/PITR/独立目标/RPO/最新删除抑制及真实负载/正式目标 | 仅CODE-QUALITY-01与UI-BROWSER-01，9.3迁移后补render/FIFO/ACK/跨owner回归；不改成UI框架工程、不重复已通过恢复矩阵 |
| 9.1 App宿主 | Capacitor工程/host/返回/前后台、受限外链、Android构建；当前JS/CSS/Xcode/SPM目标已同步iOS/Safari16.4、Firefox128 | 真实离线/配置不可用首屏与公开说明、正式应用标识/签名、Mac/Xcode实编、双端安装升级/最低版/当前版/低内存/无GMS和资源匹配证据 | 9.3组件在host上实际回归，9.4/9.5质量链；19日旧16.0/APK不是新的16.4及UI组合证明 |
| 3.1 继承编辑 | 旧2.2历史和在制身份保留 | 当前合同、1.0/2.7/2.9/2.10/2.11真实前置及keep/change/remove迁移审计 | 继续paused/in-progress；解除全局停止不解除该Story自身暂停 |

详细只读核对（包含源码摘要漂移范围、任务与证据定位）见research/in-progress-ui-dependency-audit-2026-09-25.md。旧1.0/1.6大项复选框偏保守，不能机械重写已完成实现；按progress与当前源码逐slice更新证据。旧报告只对应旧源码，当前有变化的文件需受影响回归。

## 近期顺序与启动条件

| 顺序 | 执行动作 | 做到什么程度再继续 |
| --- | --- | --- |
| 1 | 小范围调整Sprint执行安排，并在9.4前提交Git基线 | 明确插入UI工作并解除1.7后停止；保留代码/数据、3.1暂停和真实门槛；提交并推送跨设备可同步的代码/文档/锁文件，不重做产品规划 |
| 2 | 开发9.4：Storybook、MSW、真实lint | CS已完成、定向VS通过；DS→测试→CR，工具实际可运行，两项条件有正反例实证；不等待Mac才开始独立工作 |
| 3 | 准备并开发9.5 | 临近实施CS/VS，先为现有登录/Home/Settings/Sheet建立三引擎流程与截图基线，保留真实PG/IDB/SSE探针责任 |
| 4 | 准备并开发9.3 | 在9.4/9.5可用后实现共享组件/AppSheet，并在现有登录或Home实际接入；验证主要交互，本地切片与整张真机关闭分开 |
| 5 | 回到1.0、1.6、1.7、9.1做集成/回归 | 登录/Home/导入消费新基础，检查会话/恢复/返回；保留后端/journal/cursor，补受影响改动与证据。第三方登录/许可归因仍有编码，资源缺项只阻断对应实证 |
| 6 | 逐张1.8→1.9→1.10→1.11 | 导入记录、图文、视频、地点验证，每张按CS/VS→DS→测试/CR推进，不全量准备；真实适配器不能被fixture代替 |
| 7 | 分别9.6 Query→9.7 Router | 在扩展规划页面前统一读取与导航，分别验收；消费9.3已验证local gate，不互相绑成一张大Story |
| 8 | Epic2→Epic3→Epic4–8 | 每张临近实施再准备；到3.1时核对指定真实上游并完成keep/change/remove迁移检查，符合条件才解除自身暂停 |
| 9 | 9.2最终分发 | 汇总当前业务/安全/最低平台/真机证据，交付签名Android测试包与指定TestFlight可安装/升级版本；Archive/壳包/上传受理不算完成 |


Query9.6与Router9.7分别开发/验收：依赖9.4/9.5和9.3的shared-ui-local-regression-passed，不强求9.3整张原生关闭；两者不互为整张前置。9.6的/library/cities是私有owner灵感汇总，不能当公共城市目录。9.7导航不启动planning或重放operation。

## 准备与执行规则

- 当前只正式保持9.4 ready；next_story_to_prepare=9.5表达顺序，不表达已授权忽略前置或要求立刻全量生成。
- 每次CS读取CURRENT→project-context→Sprint→当前catalog/delivery→当前源块/真实代码，记录source_story_id/hash、FR/NFR、conditions、obligations到实际Tasks。VS由独立上下文复核后才ready。
- DS沿实际合同实施，有限且有意义的测试；CR按bmad-code-review独立审阅并修复确认问题。只有适用AC/工程条件证据充分才review/done，不因编译/fixture或别的Story通过而关本Story。
- 持续推进已授权的独立工作，不再为普通CS/VS/DS/CR求授权；遇硬资源只询问未提供的非秘密资源名称/配置位置，合理技术决策先落盘。真实外发消息、删除数据与公有云发布按既有具体授权边界。

## 写入与新任务交接

原Nomad Sprint Planning（01a0a132-7203-7871-bf0e-d33087ba371a）最后一轮已completed，明确1.7资源阻断；本轮读取确认其不在运行。它保留历史，不再次发送继续开发指令形成竞争。

用户随后要求9.4前完成Git提交，并明确WSL/Mac通过Git协作、Mac可承担组件与iOS，不强制当前切机。当前分支codex/story-1-0-production-auth先提交完整可迁移基线并推送，后续任务从已提交当前基线接手；不能从旧HEAD漏掉当前实现。代码/锁文件/合同/脱敏证据进Git，真实env/签名/密钥与构建缓存不进Git。开发服务资源集中VM104并通过同一后端使用，说明见docs/ops/cross-device-development.md。同一分支/共享文件保持唯一写入责任，设备切换先提交push、后fetch/pull --ff-only；不要reset/clean。

原nomad-app automation实际TOML为PAUSED；本轮不会悄悄恢复定时器。更新其未来跟进目标与共享monitor记录时保持PAUSED。即使未来恢复，也读取CURRENT新writer并去重，不能重启旧任务或批量准备。运行中的新任务不发重复催促。

## 检查与证据

- 9.4原准备/两份独立复核及本轮定向复验报告保留；本轮只更新执行授权上下文，source GWT/Tasks无变化。
- 恢复前输入快照：archive/execution-resume-2026-09-25/manifest.json。
- 远期草稿归档：archive/deferred-story-drafts-2026-09-25/manifest.json（17份合同/17份草稿自查）。
- 状态同步后必须运行ci:handoff；检查器不因解除边界而改写。边界override走已存在的用户恢复记录接口。
- 本轮检查结果与新任务回执记录见sprint-execution-resume-checks-2026-09-25.json，后续实际开发结果由新任务产生，不能在此预填。

## Git与后端交接结果

2026-09-25基线b8b445567f60fcafd0ff2d8dcd75498659b8728d已推送origin/codex/story-1-0-production-auth，9.4尚未实施。独立VM104开发API和环境集中已实际验证，原staging保留；原生HTTPS/frp配置位置仍待确认。后端连接、Mac/WSL步骤和实证边界见docs/ops/cross-device-development.md。新任务应从此后已推送的当前交接提交继续，先处理9.4，后续遵循上表九步，不重新批量准备。
