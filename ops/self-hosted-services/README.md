# Nomad 自部署服务配置准备

2026-09-19，用户选择 XHS-Downloader、自部署 Sentry / Langfuse，暂不配置 OSS/CDN 和 U-Link；随后确认“尚未部署，先准备配置”。本目录只准备配置，不启动服务、不修改当前 VM104、不推进 Story 状态。

## 已准备的文件

| 文件 | 用途 |
| --- | --- |
| `langfuse/.env.example` | Langfuse 官方 Compose 的初始化参数模板 |
| `sentry/.env.example` | Sentry 官方发行版配置的局部覆盖参数 |
| `runtime/.env.example` | Nomad 现有后端环境字段及回填位置 |
| 仓库根 `.env.langfuse-selfhost.local` | 已生成随机密码、加密密钥和待初始化的项目 Key；Git 忽略、0600 |
| 仓库根 `.env.sentry-selfhost.local` | 已设定监听、保留期与随机内部共享密钥；Git 忽略、0600 |

私有文件不会自动载入应用。`apps/server/.env` 的真实模型配置、数据库、认证等均保留；尚无真实观测实例，Sentry/Langfuse 运行时字段保持原来的空值。模板空值是待补项，不是可直接启动的完整部署配置。这里没有新增应用不读取的 `*_ENABLED` 假开关。

## 部署位置与地址

- Sentry 和 Langfuse 使用 homelab 的独立观测服务资源，不放入计划的 2 核 2 GiB ECS，也不直接挤入正在承载业务测试的 VM104。
- Sentry 官方目前给出最低 2 核 / 4 GB，推荐 4 核 / 16 GB；Langfuse 的 VM Compose 指南推荐 4 核 / 16 GiB。此处以推荐规格做后续容量评估，不将二者相加视为已分配资源。
- 目标 VM、IP、域名尚未分配，因此不填猜测的内网地址或不存在的公网域名。Sentry 上游监听预设 `127.0.0.1:19000`，后续通过同机代理或 SSH 隧道访问。远端应用使用代理的实际可达地址；不能把远端 `127.0.0.1` 当作服务地址。
- 本次未复制官方完整 Compose 文件或拉取镜像；部署时选择固定发行版本，保留其组件版本组合，再核对这些参数。不上浮到 Sentry `master` 默认的 nightly 镜像。

## Langfuse

采用当前官方自部署方案；本次核对的官方文档/Compose 为 v4。现有 Nomad 使用 `langfuse` SDK 的 `baseUrl` 接口，服务端版本/SDK接入仍须在实例创建后实测，不在本次升级 SDK 或改动遥测代码。

私有初始化参数已包含：独立 PostgreSQL/ClickHouse/Redis 凭据、NextAuth secret、salt、32 字节加密密钥、MinIO 凭据、`nomad` 组织和 `nomad-staging` 项目的初始化 Key。它们是本地生成的待注册凭据；实例完成 headless initialization 后才可验证可用性。

还需在部署时补入：

1. `NEXTAUTH_URL`：浏览器实际可达的 Langfuse URL。
2. `LANGFUSE_S3_MEDIA_UPLOAD_ENDPOINT`：浏览器可达的 MinIO/S3 入口；容器内部保持 `http://minio:9000`。本地 MinIO 是观测数据依赖，不是提前开通业务 OSS。
3. `LANGFUSE_INIT_USER_EMAIL`：管理员邮箱。管理员初始密码已本地生成，不需要粘贴到聊天。

部署使用独立数据库、Redis 和数据卷。官方 Compose 有多个端口映射，实际部署时限制到选定内网/回环地址并由代理提供需要的入口；不能仅靠 `.env` 就声称已变更监听范围。保留数据卷和备份范围需在部署阶段明确。

初始化成功后映射到 Nomad：

| Langfuse 实例参数 | Nomad 后端字段 |
| --- | --- |
| 后端实际可达的实例 URL | `LANGFUSE_HOST` |
| `LANGFUSE_INIT_PROJECT_PUBLIC_KEY` | `LANGFUSE_PUBLIC_KEY` |
| `LANGFUSE_INIT_PROJECT_SECRET_KEY` | `LANGFUSE_SECRET_KEY` |

`TELEMETRY_ENABLED=false` 关闭 Langfuse 自身遥测，不等于禁止 Nomad 向自建实例记录允许的观测数据。批量导出暂设 `false`。现有隐私过滤、评测、人审和清理责任保持，不能仅凭部署完成认定 Epic 8 交付。

## Sentry

准备 `feature-complete` 模式，避免把未来 tracing 需要的功能误裁掉；默认事件保留 30 天，后续可按容量调整。私有覆盖参数合并到固定发行版自带 `.env`，不能覆盖掉上游镜像和内部配置。上游安装程序生成的服务配置、系统 secret、管理员和项目仍未创建。

部署并创建 Nomad staging 项目后取得真实 DSN，写入后端 `SENTRY_DSN`。DSN 的 key 和项目 ID 由实例产生，当前留空。实例基地址不是 DSN；运行时采集通常只需 DSN，构建上传 sourcemap 的管理 token 在需要时另配。

## 小红书采集

确定使用 [JoeanAmier/XHS-Downloader](https://github.com/JoeanAmier/XHS-Downloader)，部署在 homelab，以 `python main.py api` 启动，默认 API 端口 `5556`。

调用官方 `POST /xhs/detail`，请求为 `{ "url": "<单条分享链接>", "download": false }`。Cookie 是可选项，先用无 Cookie 路径；后续真实认证/会话错误再处理登录条件。`download:false` 用于先取作品资料与媒体引用，不表示文件已保存或可长期访问。

Nomad 当前 `apps/server/src/ingest/adapters.ts` 读取 `XHS_DOWNLOADER_URL` 并要求响应顶层 `{title,text,media}`；官方 `source/module/model.py` 返回 `{message,params,data}`。因此部署时不能只填 URL：还需由后续采集实现解析官方封装与媒体字段，处理业务失败、超时和不可用媒体。当前不改动主线程的采集代码，运行时 URL 保持空值。

该字段为空时现有代码仍有 stub 路径；本次配置没有消除它，不可用于真实采集验收。旧 VM107 的历史采集验证也不等于 Nomad 已接通本次选定实例。真实接入需在选定版本和样本上验证。

## 延期边界

- OSS/CDN：云服务器上线前不配置、不索要桶名/域名/Key。测试阶段可用选定服务的本地持久存储；应用媒体的真实读写、下载与生命周期仍需后续实现，现有 `cosKey` stub 不代表存储可用。
- 云模型不能读取家庭局域网 URL；真实视频测试时按模型能力选择直接上传/内联输入，或经过验证的可访问媒体 URL，不能依赖尚未配置的 OSS。
- U-Link：按用户决定暂停配置和采购，不要求 U-Link Key，不将这项决定解释为已核实其所有套餐均收费。U-App 保留现有选择和已提供参数，不受本次延期影响。
- U-Link 的深链/归因验收应标记延期或待同步，不能因为不配置而宣称通过。本记录交给主线程同步相应正式范围；不擅自改写 CURRENT、Sprint 或 Story 指纹。

## 部署时的最少后续工作

选定 homelab 宿主/IP和管理员邮箱，固定上游发行版本；部署服务并初始化项目；回填真实实例 URL/DSN/项目 Key；最后验证一次受控错误事件、一次脱敏 Langfuse trace 和一次真实小红书采集。当前没有执行这些部署或外发验证。

## 官方依据

- [Sentry 自部署与资源要求](https://github.com/getsentry/develop/blob/master/src/docs/self-hosted/index.mdx)
- [Sentry 官方环境参数](https://github.com/getsentry/self-hosted/blob/master/.env)
- [Langfuse Docker Compose](https://langfuse.com/self-hosting/deployment/docker-compose)
- [Langfuse 初始化参数](https://langfuse.com/self-hosting/administration/headless-initialization)
- [Langfuse 官方 Compose](https://github.com/langfuse/langfuse/blob/main/docker-compose.yml)
- [XHS-Downloader API](https://github.com/JoeanAmier/XHS-Downloader#api-模式)
- [XHS-Downloader 响应模型](https://github.com/JoeanAmier/XHS-Downloader/blob/master/source/module/model.py)
