---
project: nomad-mvp
date: '2026-09-25'
user_request: 继续并完成所有待准备项
authorization_scope: all-pending-story-contracts-and-validation
implementation_started: false
execution_boundary_unchanged: true
---

# 全部待准备合同的执行决定

## D01 — 用户授权覆盖所有剩余准备项

本轮授权准备并验证全部待准备项，按当前catalog.preparation_order选择，包括54个backlog和暂停继承3.1的缺失当前合同，共55份/1018组源GWT。已有9.4等当前合同和7个历史done保持。该授权覆盖1.8等后续合同准备，不解除“1.7完成后停止”的开发边界，不开始业务实现、部署、真实服务/数据操作。

## D02 — 分领域研究和起草，按正式顺序收口

依bmad-create-story及其checklist使用子代理分领域读取完整源、当前代码、架构/UX、主版本官方资料，编写各自独立文件。root独占CURRENT/Sprint，子代理不得修改状态、正式源、catalog/delivery或业务代码。草稿/研究可并行，实际ready状态在验证后按既定顺序推进；不凭数字ID建立新依赖。

## D03 — 3.1准备与恢复分开

3.1保持继承in-progress，建立当前合同后设置contract_ready=true并继续paused。保留旧2.2唯一映射、baseline_commit和分支；migration_audit_complete=false，不以准备审阅冒充基于未来真实上游的keep/change/remove迁移审计。原恢复条件和真实证据门槛不变。

## D04 — 外部资源不阻塞合同写作，也不伪造完成

未选定供应商/正式账号、设备、Mac签名、性能目标或存储等写入所属Story的具体T0决策/资源验证任务与关闭门槛。研究声明、fixtures和已有局部证明不能记成真实能力完成。准备ready只表示当前合同可消费，实施前仍核对执行窗口、前序交付和实际资源。


## 后续用户指令覆盖本批范围

同日用户取消全量准备，改为按近期开发顺序滚动CS/VS，并明确移除当前开发停止边界。已生成未验证草稿保存在archive/deferred-story-drafts-2026-09-25，未将任何远期Story标ready。当前有效执行决定见sprint-execution-resume-2026-09-25.md；本文件前述全量授权和准备不开发限制仅保留历史，不作为现行派发指令。
