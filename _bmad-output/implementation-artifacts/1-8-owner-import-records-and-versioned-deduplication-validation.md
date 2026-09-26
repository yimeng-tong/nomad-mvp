---
story_id: '1.8'
date: '2026-09-26'
status: preparation-passed
implementation_complete: false
source_contract_sha256: 135cd811caa220b54791a1846c3c359d7d40407c4c2fd1ee429f61c74193b535
baseline_commit: 69fae8d80a56de1284b5b0504039837b1e53a63d
---

# Story 1.8 即时准备复核

结论：当前合同**可进入已授权的本地/隔离开发**；功能及整张 Story 尚未实施，也不证明真实短链、生产服务、PG迁移或双端设备通过。旧1.7后停止边界已按2026-09-25用户决定移除，3.1自身暂停、实服务与生产数据操作边界仍在。

## 来源与交付映射

- 现行`epics.md` Story 1.8 叙事、Requirements、11组GWT和App/Code/Shared UI补充合同与准备文件的源验收段逐字一致；catalog源SHA为`135cd811caa220b54791a1846c3c359d7d40407c4c2fd1ee429f61c74193b535`。
- 源Requirements的NFR3和delivery额外绑定的NFR8均保留；FR5/FR6/FR18.1/FR20、NFR20/NFR25及相关AR/UX责任未删。OPS-01、DB-CHANGE-01、METRICS-01/02/03、APP-HOST-01、CODE-QUALITY-01、UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01共10项逐项进入T90；`shared-ui-adoption`进入T3/T91。
- 当前Library原型`visual/story-1-4-library-import-records-r1.png`和Home Queue R4均存在。prototype-coverage将Library记为Partial，合同明确补失败、重连、去重和删除态，不把成功态原型当完整验收。

## 独立只读复核与修订

两份独立核对分别检查源/catalog/delivery/视觉和当前Prisma/受理/客户端/删除路径。根据发现已在任务中写入：

1. 首次受理的标题若尚未获取须明确pending；原单条URL目前在`parseXhsBatch`后丢失部分原貌，须经客户端journal及服务端受理保留，不能从normalized URL逆推。
2. 同一operation丢ACK后先恢复持久归一化决策，不能因redirect或policy变化产生第二job；PG唯一约束是并发裁判，旧sourceHash/owner alias需冲突审计。
3. ImportRecord状态若物化须与`appendSnapshotEvent`/结果在同事务更新；删除/撤权须覆盖既有Inspiration/result/Planner读取、worker迟到及共享对象引用。
4. 扩展现有Home灵感页而非建平行Library；新增列表/详情GET不推进ACK，但保留1.7旧job日志bootstrap。
5. 原URL目前在多个明文字段中，现有KMS零密钥回退/固定IV不能证明生产保护；需安全过渡与缺密钥fail-closed。当前`authorization.real_services=false`，短链只用注入fixture/隔离PG，真实XHS跳转保持待验。

## 准备边界

准备仅验证开发合同、当前源码入口与风险交接。OpenAPI类型、Prisma迁移、真实PG并发、Library实际渲染、Android/iOS设备及生产密钥/恢复证据都须在开发时产生；1.0/1.6/1.7/9.1整张仍各按自身条件收口，不因1.8 ready而变成done。当前准备指针随后移至1.9，按临近实施才准备，不批量生成远期Story。
