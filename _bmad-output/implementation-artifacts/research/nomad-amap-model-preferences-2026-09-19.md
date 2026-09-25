---
title: Nomad 高德资源与 Qwen 3.8 模型评测偏好
date: '2026-09-19'
record_type: side-conversation-resource-and-preference-record
decision_source: 用户本轮提供资源并要求记录
status: backend-provider-configured-per-user-direction-not-invoked
credentials_local_file: .env.nomad-integrations.local
backend_credentials_local_file: apps/server/.env
amap_credentials_recorded: true
amap_live_verified: false
provided_model_endpoint_type: bailian-token-plan
backend_use_selected_by_user: true
backend_provider_configured: true
backend_provider_live_verified: false
provisional_orchestration_model: qwen3.8-max
model_evaluation_executed: false
production_model_selection_finalized: false
---

# 高德资源与模型偏好记录

本轮按用户要求保存资源和选型偏好，并根据后续明确指令将所提供地址和Key配置到后端env；现有单模型编排适配器暂用Max，最终分工仍以评测为准。没有执行高德请求、模型推理、模型列表查询、付费评测、服务重启或部署。未修改业务代码、CURRENT、Sprint及正式Story验收状态。正文仅记录字段名、用途和公开地址，不记录任何密钥值。

## 已收到的高德资源

| 用户控制台名称 | 服务类型 | 私有配置字段 | 用途 |
| --- | --- | --- | --- |
| nomadweb | Web服务 | `AMAP_WEB_SERVICE_KEY` | 后端 POI、地理编码、路线等适用接口；这是当前后端已经读取的字段名 |
| nomad | Web端 | `AMAP_JS_API_KEY` | 网页/PWA地图 JS API；该字段名是此次资源登记约定，尚未接入前端代码 |
| nomad 对应安全密钥 | JS API安全密钥 | `AMAP_JS_SECURITY_CODE` | 计划通过后端代理使用；不直接打包到前端，字段尚未接入代理 |

三项值按用户输入保存，未修正、补全或替换字符。是否有效、已启用哪些接口、域名/IP限制及额度仍待实际联调。后续不应继续把它们报告为“用户尚未提供”。

## 用户的模型比较与优先分工

用户原意：比较“3.8omini”和“3.8max”，优先前者做视频理解、后者做编排，但最终分工取决于评测结果。

按当前官方模型目录，将用户写的“3.8omini”理解为 Omni 方向，并登记以下候选调用ID；这不代表已经验证该账号有调用权限或已固定生产版本：

| 任务 | 优先候选 | 当前决策程度 |
| --- | --- | --- |
| 视频/音视频理解与证据提取 | `qwen3.8-omni-flash` | 优先评测；保留用户原称“3.8omini”供核对 |
| 规划编排、结构化任务与工具调用 | `qwen3.8-max` | 已作为现有编排适配器的暂定配置；不是生产评测定版 |

- 最终根据实际质量、失败情况、延迟和费用选择；允许评测结果改变角色分工。
- 评测时记录真实模型ID/快照、地域、参数、提示词版本、输入样本与结果，避免仅比较可漂移的别名。
- 视频侧比较 POI 识别、作者评价归属、音轨/字幕理解、时间戳证据、幻觉、局部补看和失败降级。
- 编排侧比较结构化输出、工具选择、约束遵循、计划可执行性、失败恢复，以及成本和P50/P95。
- Omni与Max的音频输入能力不同。进行共同能力比较时应控制输入信息一致；比较完整音视频方案时，Max路线如另用ASR，应把ASR质量、费用和延迟一起计算，不能把缺失音轨当公平输入。
- 两个模型的输出均不替代服务端owner、预算、版本及约束验证，不授权模型直接修改持久业务数据。
- 这只是评测意向，不是“低价失败后总是升级Max”的固定路由，也不启动任何评测。

## 用户提供的模型地址与凭据边界

用户提供的地址：

```text
https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
```

用户后续明确指令：“忽略这个限制，不需要单独做额外处理，后端就用这个”。据此，凭据和地址已配置到 `apps/server/.env` 的普通后端字段：

```text
AI_PROVIDER_BASE_URL
AI_PROVIDER_API_KEY
AI_PROVIDER_MODEL=qwen3.8-max
```

公开文档中关于Token Plan的使用范围已在前一轮告知用户；最新执行选择以上述用户指令为准。保留官方来源作历史依据，不再将另外申请推理Key作为本项目的前置条件，也不添加针对该套餐的特殊拦截、隔离变量或自动切换地址逻辑。

当前配置行为：

1. 后端使用用户原样提供的Base URL和Key，沿现有 `AI_PROVIDER_*` 适配器读取。
2. 原 `BAILIAN_TOKEN_PLAN_*` 专用登记字段已移除，不保留第二套模型凭据配置。
3. `AI_PROVIDER_MODEL` 暂设 `qwen3.8-max` 承担现有编排路径；视频侧Omni偏好仍保存于本记录，独立视频模型路由待对应实现。
4. 真实接口有效性、支持模型及能力仍未测试；按供应商实际返回处理普通鉴权、限流和错误，不伪报成功。
5. 未启动应用或付费评测，未修改主线程启动脚本。后端进程仍需按既有部署方式加载env后才生效；本地env变化不代表远端已部署。

## 存储与后续交接

- 高德私有文件：项目根目录 `.env.nomad-integrations.local`；权限0600，使用已有 `.env.*` Git忽略规则。
- 模型私有配置：`apps/server/.env`，仅新增/更新三项 `AI_PROVIDER_*` 字段并将权限设为0600，保留原数据库、Redis及其他配置。该文件由已有 `.env` 规则忽略。
- `.env.aliyun-admin.local` 和 `.env.story-1-0.local` 保持原样；未重启或改动主线程运行进程。
- 高德Web服务Key可在对应实现阶段按受控方式加载；JS API Key/安全密钥仍需前端与代理适配。
- 所有凭据曾通过聊天提供，建议真实生产使用前轮换。新值应替换私有配置，不进入文档或Git。
- 9月19日已确认的PNVS三端图形、短信及U-App资源状态不被本记录降级；U-Link宿主验证、真实认证和模型业务调用等仍按各自证据判断。
- 本轮验证范围：新增文件格式、密钥字段存在且与输入一致、权限与Git忽略状态、文档无密钥值、引用存在性；不包含供应商有效性或业务验收。

## 官方来源

- [高德Web服务Key](https://lbs.amap.com/api/webservice/guide/create-project/get-key)
- [高德JS API安全密钥及代理](https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode)
- [Qwen3.8-Omni-Flash模型信息](https://help.aliyun.com/zh/model-studio/qwen3-8-omni-flash)
- [Qwen3.8-Max模型信息](https://help.aliyun.com/zh/model-studio/qwen3-8-max)
- [百炼Base URL总览与Token Plan使用边界](https://help.aliyun.com/zh/model-studio/base-url)
- [Token Plan专属凭据说明](https://help.aliyun.com/zh/model-studio/token-plan-team-quickstart)

当前资源交接参照：`_bmad-output/implementation-artifacts/research/story-1-0-resource-confirmation-2026-09-19.md`；整体部署方向参照：`_bmad-output/implementation-artifacts/research/nomad-cloud-homelab-app-selection-2026-09-18.md`。
