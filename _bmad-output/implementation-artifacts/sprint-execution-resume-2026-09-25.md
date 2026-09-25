---
project: nomad-mvp
status: approved
action: resume-execution
recorded_at: '2026-09-25'
scope_revision: ui-foundation-2026-09-20
supersedes_stop_after_story: 1-7-durable-import-progress-and-restart-recovery
user_request: 按照bmad的要求，只需要对后续需要推进的内容先做，不需要全量。现在的开发停止边界可以移除。核对已调整的 Sprint → 梳理 1.7
  等在制 Story 的剩余项和新增依赖 → 明确近期开发顺序 → 只对即将实施的 Story 做 CS/VS → 新启对话进行开发与审阅。
stop_after_story: null
allowed_story_keys:
- 9-1-capacitor-app-installation-and-host-foundation
- 1-0-production-login-and-multi-device-sessions
- 1-6-home-multi-link-import-queue-and-honest-status
- 1-7-durable-import-progress-and-restart-recovery
- 9-4-component-workbench-and-enforced-code-quality
- 9-5-browser-flow-and-visual-regression-gates
- 9-3-shared-ui-components-and-safe-app-sheet
- 1-8-owner-import-records-and-versioned-deduplication
- 1-9-production-image-text-understanding-and-evidence
- 1-10-adaptive-video-understanding-and-local-frame-resampling
- 1-11-amap-poi-verification-branch-disambiguation-and-manual-correction
- 9-6-identity-scoped-server-read-queries
- 9-7-typed-navigation-and-host-history
- 2-3-single-city-travel-time-and-boundary-confirmation
- 2-4-unified-flight-and-rail-service-lookup
- 2-5-preplanning-nightly-stays-breakfast-and-luggage
- 2-6-preplanning-pace-and-additional-constraints
- 2-7-full-city-picker-and-l3-place-intent
- 2-8-shared-poi-information-sheet
- 2-9-single-planning-job-and-stable-timeline-transition
- 2-10-authoritative-route-facts-and-timeline-transport
- 2-11-constraint-first-complete-single-city-planning
- 2-12-amap-candidate-expansion-and-nonblocking-candidate-list
- 2-13-anchor-pool-buckets-shared-admission-and-versioned-snapshots
- 2-14-daily-load-estimation-and-explainable-summary
- 2-15-post-plan-place-search-and-manual-candidates
- 3-1-minute-timeline-editing-and-plan-wide-undo
- 3-2-controlled-candidate-placement-and-free-time-filling
- 3-3-post-plan-nightly-stay-breakfast-and-luggage-editing
- 3-4-incremental-validation-and-typed-conflict-fixes
- 3-5-controlled-conversational-local-adjustment
- 4-1-cross-city-intent-and-linked-trip-input-draft
- 4-2-adjacent-city-transfers-and-handoff-day-boundaries
- 4-3-independent-city-planning-and-atomic-linked-trip-publication
- 4-4-active-city-editing-and-linked-trip-revision-rebinding
- 4-5-day-excursion-intent-and-round-trip-transfer-draft
- 4-6-day-excursion-planning-and-atomic-timeline-publication
- 4-7-day-excursion-editing-and-scope-guards
- 5-1-revision-bound-ai-detail-enrichment
- 5-2-verifiable-result-sheet-and-citation-reading
- 5-3-line-level-detail-editing-and-ai-preservation
- 5-4-revision-bound-export-generation-and-preview
- 5-5-whole-trip-image-download-and-system-sharing
- 6-1-planned-meal-slots-and-primary-alternative-pool
- 6-2-foreground-location-meal-recall-and-plan-context-fallback
- 6-3-normalized-business-areas-and-owner-food-hints
- 6-4-trip-checklist-and-direct-or-ai-record-entry
- 6-5-lightweight-shopping-notes-and-label-shortcuts
- 7-1-recent-trips-and-context-resume
- 7-3-settings-account-and-available-actions
- 7-4-account-data-copy-export
- 7-5-account-deletion-and-cleanup-results
- 7-6-feedback-entry-and-reliable-submission
- 8-1-cross-flow-observability-and-fault-localization
- 8-2-reproducible-quality-regression-and-version-comparison
- 8-3-task-level-provider-routing-and-safe-release
- 8-4-platform-budget-and-usage-policy-management
- 8-5-terminal-ai-amap-incidents-and-telegram-alerts
- 8-6-operations-overview-and-read-only-diagnostics
- 9-2-android-apk-and-ios-testflight-delivery
preparation_policy: just-in-time-for-next-executable-story
execution_plan: _bmad-output/implementation-artifacts/near-term-development-plan-2026-09-25.md
preserves_paused_story: 3-1-minute-timeline-editing-and-plan-wide-undo
---

# 恢复开发与滚动准备决定

## 授权来源

用户同日明确要求移除当前开发停止边界，并改为先核对Sprint/在制剩余项/近期顺序、仅对即将实施内容做CS/VS，再新启任务开发与审阅。上述原话记录在frontmatter。文件仅记录已经给出的授权，不自行赋予权限。

## 决定与后果

1. CURRENT与Sprint的stop_after_story改为null，不再用旧1.7停止指令拒绝独立开发；scope/capacitor/ui批准快照与源catalog保持不变。
2. 当前首个可执行Story为已准备的9.4；9.5与9.3顺序不变，但只在即将实施时从现行源/代码重新CS/VS。随后回看1.0/1.6/1.7/9.1新增UI与真实关闭缺项，再按现行preparation_order持续处理。
3. 不把全部backlog提前改ready。此前全量草稿保留在archive/deferred-story-drafts-2026-09-25，本轮没有给这些草稿正式就绪结论。3.1仍paused/in-progress，合同/上游/keep-change-remove审计门槛未豁免。
4. 真实设备、macOS/Xcode/签名、协议/归因、生产备份/恢复和正式指标目标仍是对应切片的关闭门槛；缺资源不取消独立实现，也不把fixture/构建/旧证据当真机或生产完成。只询问未提供资源的名称/配置位置，不重复索取已有Key。
5. 后续用户进一步要求在9.4开发前提交Git，并支持WSL/Mac通过Git同步；Mac可承担组件和iOS，无需强制切机。当前未提交实现/合同先形成可追溯基线，再由新任务/设备接手；旧Nomad Sprint Planning保持只读历史。同一共享文件保持唯一写入者，不从旧HEAD漏代码、不reset/clean。服务端env集中homelab，不随Git迁移。
6. 沿用已授权持续BMAD执行，不为普通CS/VS/DS/CR再次求授权；跨Story依赖、外部真实消息/数据操作/公有云等具体边界仍遵守现行授权。合理决定写背景/依据/决定/后果。

## 近期责任

具体剩余项和启动/关闭条件见near-term-development-plan-2026-09-25.md。9.4复验完成后新任务执行bmad-dev-story→针对性测试→bmad-code-review；仅下一可执行Story接近实施时再CS/VS。真实资源出现时优先核对在制Story，不重跑已通过矩阵制造进展。


## 后续同日明确的顺序与跨设备要求

用户指定九步：Sprint调整/处理旧停止 →9.4→9.5→9.3→回到1.0/1.6/1.7/9.1集成回归→1.8/1.9/1.10/1.11逐张→9.6/9.7分别→Epic2/3/4–8→9.2最终分发。9.4开始前进行Git提交。随后澄清“mac还是承担组件和ios开发，不要求必须切过去，但需要支持跨设备通过git同步的开发。开发测试所需的env等需要放到homelab的后端可以直接调用。”本记录消费该授权，允许为此保留旧服务/数据库地新增隔离开发后端、集中既有配置并验证连接；不把该授权扩大为真实短信/付费探测、真实用户数据迁移或公有云发布。
