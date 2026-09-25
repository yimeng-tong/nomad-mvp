---
project: nomad-mvp
story: '8.6'
date: 2026-09-13
status: bounded-research-for-main-agent-review
researcher: delegated-overview-composition-agent
scope: Grafana native dashboards and links versus existing Node React thin overview
surface: desktop-web-only
installed: false
deployed: false
credentials_read: false
production_data_queried: false
business_code_changed: false
---

# Story 8.6 运营总览组合方案调研

## 建议

**优先在既有受保护的桌面运营 Web 表面增加一层 Node/React 只读聚合与受鉴权链接；Grafana 保留为已有实例可复用或以后规模扩大时采用的原生可视化工具，不要求本期新部署。** 主代理应结合实际已有部署和视觉评审作最终选择。

Grafana 的原生图表、变量、时间选择和跨页面链接成熟，但本项目最重要的工作是保持各来源的指标定义、权限与时间口径。无论选哪种界面，8.4 的 PG 账本、8.5 的 incident/投递状态和 8.2 的封存评测报告都必须继续作为各自权威。采样 trace 不能补成真实账本，汇总页也不能创造原来源尚未提供的可靠性事实。

本研究已读 Epic 8 的 8.6 拆分及现行 observability 合同。主代理已转达用户批准 8.5 并继续，源文档正在同步；不因旧 frontmatter 重开批准。仅桌面 Web，不要求移动适配。不重建日志搜索、策略编辑、客服、值班、用户内容钻取，也不把旧 8.2/7.6 示例理解为恢复已废弃方案。

## 观察版本与八组来源

外部观察日期均为 **2026-09-13**。仅访问官方文档和 GitHub 公共源码；没有登录 Grafana、连接业务数据库、读取凭据、安装插件、创建账号或部署。

| 组 | 官方/GitHub 来源 | 核验内容 |
| --- | --- | --- |
| G1 | [Grafana Dashboards](https://grafana.com/docs/grafana/latest/visualizations/dashboards/)、[Dashboard links](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/manage-dashboard-links/) | 多来源 panel、原生链接、时间和变量传递 |
| G2 | [Query and transform data](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/) | Mixed/Dashboard source、面板独立时间与分辨率影响 |
| G3 | [PostgreSQL 配置](https://grafana.com/docs/grafana/latest/datasources/postgres/configure/) | 内置 PG datasource、SQL 权限、连接池与来源保护 |
| G4 | [Configure security](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/)、[官方 datasource 安全解释](https://grafana.com/blog/data-source-security-in-grafana-best-practices-and-what-to-avoid/) | Viewer 可查询范围不受面板 SQL 限制 |
| G5 | [Data source management](https://grafana.com/docs/grafana/latest/administration/data-source-management/) | datasource permissions、Enterprise/Cloud query cache 与 TTL |
| G6 | [官方嵌入方案](https://grafana.com/blog/how-to-embed-grafana-dashboards-into-web-applications/)、[JWT 配置](https://grafana.com/docs/grafana/latest/setup-grafana/configure-access/configure-authentication/jwt/) | 深链接、public snapshot、身份保持、iframe 与 Cloud 条件 |
| G7 | [Install Grafana / sizing](https://grafana.com/docs/grafana/latest/setup-grafana/installation/) | 最低与小规模资源、刷新/查询负载、持久配置库 |
| G8 | [v13.2.1 release](https://github.com/grafana/grafana/releases/tag/v13.2.1)、[固定 LICENSE](https://github.com/grafana/grafana/blob/v13.2.1/LICENSE) | 实际版本与 AGPL-3.0 许可 |

GitHub releases 当时最新主版本补丁为 `v13.2.1`，发布时间由 release HTML 核对为 `2026-09-02T07:00:31Z`；同时存在旧分支补丁，不能把列表顺序当版本大小。官方 latest 文档标 v13.2。公开源码能证明功能和许可，不证明 Nomad 已部署 Grafana。实际现存 Grafana、Sentry、Langfuse hosting/版本/权限未知；本研究不提出自动升级。

## 能力对照

| 方面 | Grafana OSS/native | 既有 Node/React 薄总览 | 对 Nomad 的判断 |
| --- | --- | --- | --- |
| 图表与入口 | time series、stat、table、变量和 dashboard/panel/data links；PG datasource 预装 | 使用既有 UI 组件展示固定指标和来源入口 | Grafana 图表复用强；本期若只需有限摘要，薄页无需复制通用仪表盘引擎 |
| 多来源组合 | 不同 panel 可用不同 datasource，Mixed 可在一 panel 组合 | 服务端对少量固定查询独立并发、逐源返回状态 | 两者都需自定义“质量/成本/告警含义”，工具不会自动对齐事实 |
| PG 账本/incident | 专用 SQL datasource 可读聚合视图 | 复用 8.4/8.5 现有受保护查询服务 | 不把业务主表直接开放给总览用户，不另建可写权威 |
| 访问边界 | Viewer 默认能向有权 datasource 发任意查询；folder/panel 不是底层数据 ACL | 固定参数、字段白名单、服务端 operator guard，容易控制返回面 | 本项目无用户内容钻取要求，薄 API 更易表达最小权限；仍需实测权限 |
| 部分失败/陈旧 | panel 可分开查询，但业务含义、缺数据和缓存状态要自定义 | 可明确返回每卡 fresh/stale/empty/error/forbidden 状态 | 不接受一处失败使全页空白，或失败被 `0`/旧绿色状态掩盖 |
| 深链接 | 原生支持带时间与变量的链接 | 服务端生成允许目标的链接与过滤覆盖说明 | 首选正常登录的工具链接；身份与目标权限不随 URL 自动获得 |
| 运营成本 | 新服务、配置库、用户权限、插件/版本维护与更多代理查询 | 现有服务增量代码、缓存、查询预算和组件维护 | 已有 Grafana 可复用；未核实已有实例时，不为薄总览先引入整套新运维 |
| 免费/付费 | OSS 常规 dashboard/PG/link 可用；datasource permissions/query cache 在 Enterprise/Cloud | 不新增平台订阅；现有数据源 API 仍有配额/套餐限制 | 不把插件存在、试用版或开发环境权限当生产证据 |

表内 Grafana 能力由 G1–G5 支撑；薄总览是项目适配建议，未编写或测试业务代码。

## 各来源与时间口径

建议总览每个摘要都携带最小 provenance：来源、环境、能力/Provider 过滤范围、实际窗口起止与时区、源端 `asOf`/`observedAt`、本次 `fetchedAt`、数据状态、覆盖率/分母、定义/报告版本及受保护入口。没有来源支持的字段保持未知，不临时伪造。

| 汇总对象 | 权威与窗口 | 不应做的计算/显示 |
| --- | --- | --- |
| 质量 | 8.2 已封存报告、dataset/model/prompt/schema/规则版本、自动与人评完成度；必要时分开列最近报告时间 | 不把某天线上 trace 平均分当完整评测，不把尚未完成人評写“质量通过”；全局时间选择不改写封存样本集合 |
| 延迟/失败/降级 | 8.1 已有安全查询或前序真实聚合；注明采样、成功/失败总体和窗口 | 不平均多个 P95 得全局 P95，不合并不同分母失败率，不把缺 span 算快/成功 |
| 成本与用量 | 8.4 PG 账本及其原预算/供应商周期、币种、价目/来源版本 | 真实量、估算金额、已核对账单、预留、未知分开；不从 Langfuse sampling 补账，不把多币种相加，不由总览重结算 |
| 活跃异常/投递 | 8.5 当前 incident episode 与查询 `asOf`；窗口内新增/恢复次数另记 | “当前未恢复”“最近24小时产生”和“Telegram投递失败/未知”不能混成一个事件数；查询失败不等于无告警 |
| 配置状态与入口 | 8.3 route release/pause、8.4 budget policy、8.5通知策略已有受保护读接口 | 不复制编辑器，不由总览发布/回滚/暂停、解除静默或触发测试发送；读缓存不能成为调用授权 |

全局可选时间范围用于支持该范围的指标；对预算账期、封存评测、当前 incident 等不同口径保留自己的明确标签。对不支持某过滤维度的来源，显示“该卡未应用此筛选/源端范围”，或把卡置为该筛选下不可用，不能静默显示全量数据却让用户以为是同一 Provider。

Grafana 已支持单 panel `Relative time`、`Time shift` 覆盖；官方说明 dashboard 为 absolute range 时 panel time override 不生效。因此若用固定预算月与任意指标时间并列，不能只依赖隐藏的面板 override；须由查询/标题明确实际窗口并验收。[G2](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/)。

另一个容易漏掉的精度问题：Grafana `Max data points` 默认跟 panel 像素宽度相关，聚合/Stat reducer 结果可能随分辨率改变。成本总数、样本数、失败率等 KPI 应由源端按固定合同聚合后返回；趋势图可以降采样，但不能让窗口大小或面板宽度改变权威数字。[同一 Query options 文档](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/)。

跨 Sentry/Langfuse/PG 的读请求没有天然全局数据库快照。可冻结这次查询的绝对 `from/to`，但必须保留逐源生成时刻和覆盖差异；刷新成功不能宣称全部来源同一时刻一致。不要通过下载原始用户内容做跨源 join 来“补齐”这一缺口。

## 部分故障、缓存和查询负载

对薄总览的最小建议：服务端为每个来源设独立 timeout、取消与并发上限，以等价于 `Promise.allSettled` 的独立结果收集方式组合；一个供应商故障只影响对应卡。只读刷新不得启动模型推理、重试用户 job、做账本修复或发送告警。

每卡区分：加载中；完整且新鲜；真实空集；有值但缓存陈旧；查询失败；来源未配置；访问不允许。真实 0 是查询成功且覆盖足够时的事实，`null`、超时、401/403、过期或未接入不映射为 0。若显示旧值，同时显示原 `asOf`、已过时与失败原因摘要；不能在下次刷新时仅把 `fetchedAt` 更新成现在。

缓存键包含授权范围、环境、Provider/能力、时间窗、来源/定义版本；变更筛选时旧请求晚返回不能覆盖新范围。权限失效后不继续展示之前受限的缓存。应有界保留缓存、刷新节流/合并、手动重试限制；不循环无间隔重试、不为了填图生成新数据。

Grafana 原生 query/resource cache 在官方管理文档标为 **Enterprise/Cloud**，不是 OSS 默认能力；默认 query 不缓存，支持的 datasource 才可启用。TTL、query interval 与时间范围对齐影响返回新鲜度，不能把 cache hit 当上游现在可用。datasource 自身还可能有自己的缓存，必须显示的是来源事实时间，而不只是 Grafana 渲染时间。[G5](https://grafana.com/docs/grafana/latest/administration/data-source-management/)。

原生 Dashboard datasource 可复用 panel 查询结果，Mixed/transform 可减少重复展示代码；但不能通过 transform 默默去除缺数据行、把 null 置零或拼接不同采样范围，造成貌似完整的总数。[G2](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/)。这类正确性与部分故障行为需要真实组合测试，本次仅证实工具能力，未验证目标 dashboard。

PG 原生 datasource 的默认连接池配置并不针对 Nomad 生产预算写入负载；应限制连接、语句耗时、允许窗口、返回行/点数，并优先复用经过约束的聚合查询。即使只读，频繁全表聚合也会争用资源。若未来用只读副本或物化视图，应显式显示延迟而不是宣称账本实时。[G3](https://grafana.com/docs/grafana/latest/datasources/postgres/configure/)。

## 权限、深链接与嵌入

**Grafana Viewer 不是数据隔离边界。** 官方安全文档明确：用户可对有权 datasource 提交任意查询，不仅仅是面板预置 SQL。隐藏查询编辑器、Explore、原始数据列、dashboard 变量或 URL 参数都不能阻止查询更大范围。即使有 Enterprise datasource permissions，也主要控制能否访问数据源，而非替用户限制所有可执行查询。[G4](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/)、[官方解释](https://grafana.com/blog/data-source-security-in-grafana-best-practices-and-what-to-avoid/)。

如果采用 Grafana，最低安全方案是独立只读 datasource 身份，只能读批准的运营聚合视图/数据库或固定只读 API；不能复用业务应用连接串、数据库 owner 或用户内容表访问权。官方 PG 文档也要求专用受限 `SELECT` 用户，因为 Grafana 不验证 SQL 安全。数据库角色/视图和服务端 API 才是最终限制，前端 filter 不是权限。[G3](https://grafana.com/docs/grafana/latest/datasources/postgres/configure/)。

薄总览同样必须在服务端复核 operator 身份、组织/环境范围和参数白名单。客户端不能获得 Sentry/Langfuse/Grafana 服务账号 token，也不能透传用户给出的任意 SQL、URL 或 filters 到后端代理。返回字段固定，禁止生成用户行程/POI/原始反馈等钻取入口。

优先采用普通、受登录保护的 deep link：限定 hostname/project/environment/path，携带安全的绝对时间和已支持的过滤条件；目标工具自己重新鉴权。链接可达不等于用户有权限，登录/403 应诚实交给目标，不改用公共分享来绕过。某些目标不支持全部筛选时，说明实际带入范围，不能声称跳到了完全相同结果。[Dashboard links](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/manage-dashboard-links/)。

**本期不建议 iframe、public snapshot、anonymous dashboard。** 原因是新增来源的身份映射、Cookie/CSP、撤权和 token 管理成本超过这个薄总览需要；不是声称私有嵌入不可能。Grafana 官方嵌入文章于 2026-05-15 更新，明确 OSS/Enterprise 可配置，Cloud 在资格/许可与特定配置满足时也支持，需要厂商确认。旧“一律不支持 Cloud 私有嵌入”结论已不准确。[G6](https://grafana.com/blog/how-to-embed-grafana-dashboards-into-web-applications/)。

若以后选择嵌入，需另证独立用户身份、最小数据源权限、仅允许明确 HTTPS origin、短期身份凭据、TLS、撤权和实际浏览器行为。不能开启匿名访问来省登录，不能把长期 token 或服务账号 token 放 URL；官方 JWT 文档警示 URL token 会进入日志等记录。`allow_embedding=true` 只是允许 framing，不自动提供认证或数据隔离。[JWT 文档](https://grafana.com/docs/grafana/latest/setup-grafana/configure-access/configure-authentication/jwt/)。

## 资源、许可证与迁移

Grafana `v13.2.1` 主仓库 [LICENSE](https://github.com/grafana/grafana/blob/v13.2.1/LICENSE) 为 AGPL-3.0。OSS dashboard、常规链接和内置 PG datasource 本身不要求 Enterprise；Enterprise/Cloud 的 datasource permissions/query caching 等需核实实际授权和套餐。插件和其他组件各自许可另算，不能把整个生态一概称免费。未报价未知的 Cloud/Enterprise 成本，不把申请试用或购买作为本期前置。

官方当前 sizing 区分评估最低 512 MB/1 CPU 与小规模部署参考 2 CPU、2–4 GB RAM，另有配置数据库磁盘和数据源资源。这里是 Grafana server 指导，不是本项目承诺；实际面板数、并发查看、刷新频率和 SQL proxy 决定负载。新增 Grafana 也需要维护配置库、插件版本、访问控制、备份与升级，而不是只放一个静态网页。[G7](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)。

薄 Node/React 页复用已有运行时和运营权限入口，增量主要是少量固定读查询、卡片、来源状态与链接映射；也需要超时/缓存/权限/查询成本验证，不能称零维护。它应保持有限摘要和原工具入口，不逐步复制 Grafana 查询编辑器或 Sentry/Langfuse 的搜索、人评功能。

建议迁移顺序：先确定前序已存在的各只读返回合同与来源映射，再选展示；若已有合格 Grafana 实例和聚合数据源，可直接原生建页，并保留相同 freshness/权限合同。以后从薄页迁移到 Grafana时，只替换展示/链接适配，PG账本、incident和评测定义不变；反向关闭Grafana也不影响预算授权、告警发送或用户任务。

总览新增的数据副本应限定为有界的匿名化/最小关联聚合缓存。源端删除/权限变更后需要清理相关缓存和安全引用；截图、snapshot、导出、共享链接会产生额外副本，因此不自动开启。数据源的查询成功、缓存到期、URL失效均不能宣称完成全部数据删除。

## 提供主代理的验证点

1. 桌面总览能独立显示已有质量/延迟/成本/降级/告警摘要与前序入口；不等待新通用平台，不新增用户内容钻取。
2. 每卡来源/实际窗口/环境/覆盖率/版本/新鲜度可核对；封存评测、预算账期与当前异常不受一个全局时间选择误导。
3. 分母、币种、样本与估算/实际/未知有明确区分；改变面板宽度、采样点数或查询粒度不能改权威KPI。
4. 来源超时、空集、401/403、未配置、缓存陈旧分别验证；一处失败不冒充全局健康或让其余已成功来源消失。
5. 并发刷新、快速改筛选和晚响应不串范围；权限收紧不继续显示旧缓存；刷新不写业务状态或触发供应商推理。
6. 深链接目标、project/env/time/filter映射准确且不携带凭据；目标未登录/无权不降级成公共分享。
7. 若采用Grafana，实测Viewer/API任意查询只能触达批准的聚合面，不能读业务主表或执行变更；不用面板SQL/隐藏Explore代替此验证。
8. 查询连接数、超时、最大窗口/点数、刷新节流和缓存占用有实测边界，不争用8.4预算事务和8.5投递worker到不可接受程度。

本报告只是选型与合同输入；未完成运行验证、视觉批准或最终采用决定。仅新增本文件，没有修改业务代码、配置、正式GWT或sprint状态，没有嵌套代理。
