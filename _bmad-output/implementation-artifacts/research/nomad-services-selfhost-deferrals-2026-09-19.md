---
date: '2026-09-19'
record_type: side-conversation-selection-update
status: configuration-prepared-not-deployed
decision_source: user-in-this-side-conversation
xhs_provider: JoeanAmier/XHS-Downloader
xhs_live_integrated: false
oss_cdn: deferred-until-cloud-deployment
ulink: deferred-by-user
uapp: unchanged
sentry: self-hosted
langfuse: self-hosted
instances_created: false
runtime_verified: false
configuration_guide: ops/self-hosted-services/README.md
---

# 自部署与延期选择更新

用户决定：小红书采集使用 XHS-Downloader；OSS/CDN 在上线云服务器前暂不配置；U-Link 暂不配置；Sentry、Langfuse 使用自部署版。用户进一步确认两个观测服务尚未部署，本次先准备配置。

本记录更新 9 月 18 日云端/homelab/App 选型存档中对应的资源时机；手机号认证、图形认证、U-App、既有模型和高德配置保持。

已准备 [配置说明](../../../ops/self-hosted-services/README.md) 与三个公开 env 模板。Langfuse 初始化密码/项目 Key、Sentry 内部共享密钥仅在两个本地私有 env，权限 0600 且 Git 忽略。本次未连接 homelab、未部署、未采购、未采集、未发送观测事件，也未推进 Story 状态。

部署前待确定宿主和地址、Langfuse 管理员邮箱；Sentry 项目创建后生成真实 DSN。Langfuse Key 仅为待初始化值，当前未在服务端生效。应用运行时尚未填入无效或猜测的服务地址。

现有 XHS 适配器与官方 API 响应格式不一致，需在采集实现阶段补映射；留空配置时现有 stub 不证明真实可用。OSS/CDN 延期不证明本地媒体存储已实现。U-Link 对应验收仍需主线程同步范围，不得标记已通过。

后续从本记录继续资源配置；正式 PRD/Epic/Story 与归因验收范围的同步仍由主线程处理，CURRENT/Sprint 未改动。
