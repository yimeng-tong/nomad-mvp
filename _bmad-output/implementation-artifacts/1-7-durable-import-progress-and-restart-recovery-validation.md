---
story_id: '1.7'
date: '2026-09-19'
status: preparation-passed
implementation_complete: false
source_contract_sha256: 0e1274e6ec4a9fc5d6d73418d1b11068aeac1a2d289a8bbc0e886970c4e44050
---

# Story1.7 准备复核

结论：当前合同可进入已授权开发，尚未实现本Story；不证明真实PG/重启/原生设备已通过。

## 来源与完整性

- 1.7叙事、Requirements、11组GWT（含C07）从当前epics逐字保留；脚本比较源body与Story源验收段完全一致。
- source_story_id/hash/catalog/delivery正确；delivery五项FR/NFR绑定原样保留，源额外NFR20明确适用；source_obligations为空与当前映射相符。
- OPS-01、DB-CHANGE-01、METRICS-01/02/03、APP-HOST-01均进入实际Tasks与关闭证据，不从先前Story自动继承verified。
- 引用现存Dock R4原型并说明覆盖缺口；保留Web与Android/iOS真实关闭责任，3.1不恢复。

## 独立研究与fresh-context复核

三个只读研究分工检查源合同/条件、后端durable log/worker及客户端/原生恢复。两份独立fresh-context准备复核确认主要链路完整，建议的三处细化已全部写回T3/T5/T7/T8：

1. 恢复/迁移预检启动零claim/dispatch/外发，完成恢复不变量、资格和停用抑制后才启用。
2. IDB跨标签页事务内单调checkpoint合并，迟到resync受CAS约束，保留noteDone；不能只靠单流内存顺序。
3. 客户端消费队列按事件数/字节双上限，慢持久化触限后从已存cursor补读，而不是无限Promise或跳确认。

关键交接已明确：persistIngestOutput和event同事务；受理与持久派发同事务；lease/fence阻断旧worker；历史job只能真实基线/resync；旧attempt terminal不关当前新attempt；浏览器received ID不当durable ACK；原生100事件/秒及帧限制不能靠取消保护解决。

## 技术与依赖事实

核验已安装Fastify5.12.1、Prisma Client5.22.0、pg8.16.3、BullMQ5.61.2；不引入新框架或因最新文档升级ORM。官方SSE、PG事务/队列锁/通知语义已引用，目标PG版本在实施前live preflight核对。
1.6最新真实IDB/operation恢复、快照/回执和FIFO作为已实施输入；1.7的持久event/lease能力仍须实现和实证。1.0/1.6/9.1真实SDK/法律/双端等门槛保持开放。

## 当前验证与实施入口

- 源body精确一致，Given组数11；六条件有实际任务，关键源码/原型引用存在。
- 当前准备指针和ready-for-dev状态由Sprint/CURRENT同步；handoff/diff检查结果以本次执行输出为准。
- 下一步bmad-dev-story，从T0当前schema/恢复协议与故障fixture开始；原Story任务均未因准备文档勾选完成。
