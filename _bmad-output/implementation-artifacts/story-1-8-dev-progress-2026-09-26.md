# Story 1.8 开发进度

状态：in-progress。当前基线为`6163a4fbed33ee58d17d974e702b7c3726814550`，12个待更新源文件SHA已保存于`evidence/story-1-8-foundation-2026-09-26/baseline.json`；源合同准备SHA为`135cd811caa220b54791a1846c3c359d7d40407c4c2fd1ee429f61c74193b535`。仅本任务写入，Sprint指针已转1.8，3.1继续paused。

T0现状：OpenAPI是类型单一来源；`link-parser.ts`只做基础URL清理，Home当前在进入controller前已丢部分原始URL。`acceptIngestCommand`的真实PG事务持有owner/operation/source锁并创建job、初始event、pending意图和command回执；`IngestJob.sourceHash`按owner+基础URL而非1.8版本化canonical约束。`appendSnapshotEvent`是状态/seq/event原子提交点。Library路由当前仅有城市、成功Inspiration与候选；Home灵感页及Planner仍消费旧响应。schema无ImportRecord，IngestJob/Inspiration/证据可能保存明文来源URL，现有KMS零密钥回退/固定IV不可作为保护证明。

开发边界：只在本地fixture/隔离PG验证，不请求真实小红书短链或其他外部目标，不修改现有共享/生产库、密钥或Provider配置。真实采集、生产URL密钥/迁移、设备、指标和备份门槛仍开放；后续逐任务记录正反例，不能因T0完成而将整张Story或工程条件标verified。

T1局部进度：新增纯`xhs-import-v1` URL决策，明确支持的笔记路径、host/scheme/已知UTM参数和短链注入解析；未知/不安全目标拒绝，未展开短链保留独立身份，不进行任何fetch。Home分类现在分别返回基础规范URL与清理后的单条原URL，controller将原URL交给加密operation journal与受理请求；旧服务响应无`original_url`时沿用原字段。OpenAPI先新增可选`original_url`，生成类型已更新。当前服务端`parseXhsInput`仍将受理请求归一成旧job来源，尚无ImportRecord/加密字段，故**不宣称原URL已持久进record或详情可复制**。

局部验证：红灯分别确认新policy模块缺失及原URL字段缺失；绿灯新服务端4项、移动原URL1项通过，既有link parser 3项、Dock31项、全移动284项+5原生配置、Home/Library契约探针、完整workspace构建通过。typed lint在118个源文件队列中0 failure，旧例外未修改。详见本Story局部`validation.json`；CI、真实PG竞争、短链Provider及App/设备未验收。T1余下的OpenAPI/Prisma完整数据合同、受理事务、URL密钥过渡、异步短链适配及删除语义仍待实施。

T1保护预备：新增独立AES-256-GCM原URL封装，服务端仅接受显式配置的非零32字节keyring，随机12字节IV并绑定owner/record AAD；旧key可在keyring中保留以便轮换。缺密钥、全零密钥、未知key、篡改及跨owner/record解封均失败；两项独立测试、server build、定向typed ESLint通过。尚未接入ImportRecord或真实密钥，不能声称现有IngestJob/Inspiration明文已受保护；证据见`encryption-validation.json`。CI工作流已纳入本分支push触发，分支运行待核验。

T1数据库结构草案：在现有1.7迁移后新增加法`ImportRecord`表与可空Inspiration关系；owner+normalized URL持久唯一，record→job及Inspiration→record用owner复合外键，原URL仅新表JSONB受保护字段，标题可空且状态初始created。旧job/灵感未改写、未回填、未调用现有/生产PG；migration有5秒锁等待与60秒语句界限。Prisma5.22.0 schema validate、生成及完整workspace构建通过，`prisma migrate diff`与手写SQL结构已核对。CI新增仅允许`nomad_auth_test_*`本地隔离库的并发唯一、丢失事务job回滚、跨owner FK和密文字段探针；**此提交前真实PG尚未运行，DB-CHANGE-01继续in-progress**。证据见`schema-validation.json`，下一步核验新提交CI产物并审阅失败记录。旧数据冲突/回填、生产URL密钥、受理事务接线、删除生命周期继续开放。

`4110c7e`现已通过完整CI`36225948368`两job。隔离PG实际应用迁移并完成五项正反例；schema产物1文件CRC通过且报告HEAD一致，详见`schema-ci-verification.json`。这只验收DB结构当前局部切片，不代表生产迁移/回填。其后`40a72e3`的完整CI`36226573986`两job通过，隔离PG八项启动预检、record状态/标题及本owner Inspiration事务投影检查的产物HEAD/CRC一致，详见`event-projection-ci-verification.json`。

`a6362d3`把版本化规范化、受保护原URL、owner record、job、初始event、pending和command接入同一受理事务；新job不再保存明文`source_url`，新Inspiration不再写`canonical_url`，来源证据使用非URL标记。隔离PG十三项受理、并发去重、跨owner、缺密钥fail-closed、旧operation重放通过；但整轮CI`36227255902`在认证历史探针失败：旧done job的非XHS URL被新规则过早拒绝。失败及该轮成功切片均保留在`acceptance-first-ci-failure.json`，不能记完整CI通过。修复为先按保留source hash检索旧job，只有真正新受理才必须通过新URL规则；隔离探针增补对应反例。CI初版随机隔离测试key曾进入runner环境日志，未使用生产key/数据；已改为runner临时0600文件，下一轮验证。

本工作树进一步接入owner限定、只读keyset分页的ImportRecord列表/详情API；原链接仅本人详情解封，旧`/library/inspirations`继续供Planner消费。Home灵感页扩展共享组件记录区域、私有Sheet、Web/Capacitor按宿主复制操作与失败提示，身份变更取消请求并遮蔽迟到详情。OpenAPI先改并重新生成类型；本地workspace构建、136文件typed lint零失败、服务端12项/首页合同、移动288项+原生配置5项、组件3项、工作台类型/静态构建/Node网络9项通过。已编写三引擎B32/B33浏览器与工作台九场景；本机缺Playwright浏览器可执行文件，浏览器实际运行及新增隔离PG十六项等待下一轮CI，详见`acceptance-read-ui-local-validation.json`。删除/重新导入、旧数据冲突审计/回填、真实短链、生产密钥/备份、真机与正式指标仍开放；T1–T5及整张Story继续in-progress。

`d82f681`的CI`36228607706`为部分成功、整轮失败：独立浏览器job三引擎135/135、B32/B33六项、33视觉通过，944项ZIP CRC及源码指纹一致；build-and-test在工作台九个新增场景失败，严格网络策略未声明ImportRecord列表/详情GET，且场景卸载后组件重渲染读取了已失效的scenario。隔离PG十六项因此未运行。保留证据`read-ui-first-ci-verification.json`。工作树现修复路由白名单与卸载时读取，并细化Home重复记录的运行/完成/失败提示；这些修复必须在新完整CI重新验证，不从先前浏览器job推导当前源码全通过。

修复后本地workspace build、typed lint零失败、移动Vitest289项/原生配置5项、工作台类型/网络Node十项/静态构建、handoff及diff检查通过，见`read-ui-workbench-repair-local-validation.json`；本机无Playwright可执行文件，九项工作台浏览器交互与十六项隔离PG仍待CI。
