# 全部待准备合同写入协议

用户仅授权完成全部待准备项；不实现、不安装、不部署、不发送外部消息。只写分配到的Story/validation/research文件，root独占CURRENT/Sprint及批次进度。正式源epics、当前catalog/delivery、批准记录和历史done不可改。

## 每份合同必须完成

1. 按catalog精确story_id/key/title/implementation_file/source_contract_sha256取源，保留所有As a/I want/So that、Requirements、原型/范围段、GWT和Code quality/Shared UI/App补充的完整文本。不能仅粘GWT后放统一空泛Tasks，也不能另造GWT。
2. YAML至少含story_id/key、source_story_id/hash、source_epics、scope_revision、date2026-09-25、workflow=bmad-create-story、preparation_status=drafting、implementation_started=false、execution_dispatch_authorized=false、delivery_contract、migration_manifest、engineering_conditions、delivery_requirements、source_obligations、dependencies、context_commit/branch及本批授权路径。Source IDs/hash来自当前版本，不重算正式源。
3. 普通Story先Status:draft，root审阅后转ready-for-dev；3.1从创建起Status:in-progress，保留legacy_story_id、baseline_commit10f940c49e2d61ddcb1233cffddd071ed1c9284c、working_branch=codex/story-2-2-timeline-editing，migration_audit_complete=false、execution_paused=true、current_contract_implementation_started=false，不恢复。
4. Tasks全未勾选，逐组覆盖所有源AC，可合理聚合但给AC编号/标题映射。每张有特定业务实现/错误/竞态/迁移/UX/测试任务；工程条件与来源义务必须进入实际Tasks及关闭证据，不只写metadata。
5. Dev Notes必须有当前代码现状、读过的UPDATE文件路径/行为/本Story改动/保留项；NEW模块明确尚未存在。读当前工作树而非旧HEAD；上一Story未实现时明确未来输入，不假装可调用。真实上游/依赖、原型、source义务、供应商/资源gate清楚。
6. 按领域读取有关PRD/架构/UX/source与现有实现，官方资料核对相关主版本/API；共享研究可复用但每Story说明适用范围。不要为了“最新”自动升级框架或擅选供应商、编造性能目标/认证资源。
7. 附每Story的validation草稿/报告，明确检查内容、源hash/GWT数、AC→Tasks、真实/fixture界限、未验证门槛。自查不冒称独立review；root另做跨组独立审阅。
8. 模板section：Story、Acceptance Criteria、Tasks / Subtasks、Dev Notes（上下文/文件/测试/引用/历史）、Dev Agent Record及File List。Stage准备不为condition_progress写verified，不生成假运行证据。

## 当前约束

67 Story/1089 GWT、当前UI scope2026-09-20。1.7开发停止/资源阻断保持；本轮新的准备授权覆盖1.8等所有后续合同，但不覆盖开发。所有开发者UI需承接src/ui/Query/Router/9.4/9.5质量架构、iOS/Safari16.4/Firefox128；现有普通领域职责不移给这些库。7.2/8.7/8.8及4项FR仍延期。历史7done保持。

实际guard会逐字核对GWT/Requirements/叙事，并检查Code quality补充完整带入。因此最安全的是复制整个精确source block的正文，再添加具体Tasks/Dev Notes；不要修改源Case内容。新增解释不使用以**Given**/**When**/**Then**开头的行。引用路径必须真实存在，未来NEW路径单独说明。

可借用已准备9.4的可读结构，但它的专用MSW/lint、两项条件不能机械复制到其他领域。当前通用守卫runtime文件保持不动。
