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

`eb23521`的CI`36229356143`再次是部分成功、整轮失败：浏览器job三引擎135/135、B32/B33六项及33视觉/944项ZIP CRC通过；工作台40/41通过，仅Normal场景在详情仍处loading时立即查找原URL失败，PG步骤仍未运行。证据`read-ui-second-ci-verification.json`。断言现改为等待详情内容；本地把Chromium及所需共享库临时放在`/tmp`运行，首次Vite依赖重优化导致重载，未改源码重跑后工作台6文件41/41实际浏览器通过，见`workbench-final-local-validation.json`。下一步仍需同一源码完整CI与隔离PG十六项。

`c031147`现已通过完整CI`36229930650`两job。产物逐个核对：隔离PG十六项（含真实并发唯一、owner读、旧回执、事务受理）1文件CRC/HEAD一致；工作台41/41、网络Node十项、18组正反例和产品隔离26文件CRC通过；三引擎135/135、B32/B33六项、33视觉/944文件CRC及源码manifest一致。移动289及其余门禁在同一成功工作流通过。详见`read-ui-ci-verification.json`。这只验证当前受理/读取/Home UI局部实现，不包括删除、真实短链、旧数据回填、生产密钥/备份或真机。

后续工作树新增Prisma唯一冲突的一次新事务恢复：P2002先回滚，再按owner/规范URL重读已提交结果；重复冲突转为中性409。隔离PG探针增加一次真实SQLSTATE23505触发与回滚后唯一job/record/event/command检查，待下一轮CI才可证明；本地server build、定向typed lint/路由测试通过，见`unique-conflict-local-validation.json`。该合成触发不等于实际旁路写入竞争或旧数据审计，T2仍in-progress。

`aed0885`已通过完整CI`36230649027`两job。隔离PG新增SQLSTATE23505回滚/新事务恢复检查使探针达十七项，1文件ZIP CRC/HEAD/零真实Provider调用核对通过，详见`unique-conflict-ci-verification.json`。这验证合成唯一异常路径，不等于真实旁路写入竞争或生产库审计。

下一局部切片先为T4准备加法数据库结构，尚不开放删除：ImportRecord新增活动URL键与作废时间，IngestJob/Inspiration新增作废时间；旧唯一键和受保护URL必填仍保留。新迁移回填旧record的活动键并加第二个owner唯一索引；新写同步填入两个键，启动预检要求新列/索引/约束。独立CI升级探针将先在新合成PG库应用此前七个迁移并插入旧record，再应用本迁移核验保留与回填。本地Prisma validate在提供非连接合成URL后通过、workspace build/定向typed lint通过；初次validate仅因未配置DATABASE_URL失败，未连接任何数据库。见`deletion-schema-local-validation.json`及`docs/ops/import-record-url-protection.md`。下一轮隔离PG十八项及升级探针未运行；删除API、旧唯一键释放、worker/SSE/Planner撤权及对象生命周期仍全部开放。

`c6fd134`完整CI`36231375405`两job通过；主隔离PG十八项与独立旧record升级五项均从产物核对HEAD、完整、CRC，详见`deletion-schema-ci-verification.json`。该提交仍保留旧唯一键且没有删除入口。

随后工作树进入T4服务端局部：第二迁移在活动键/唯一索引预检通过后才删除旧`(userId,normalizedUrl)`索引，旧record原URL与policy版本不重写；owner DELETE同事务作废record/job/关联Inspiration、撤销pending/lease并增长fence。受理按活动键查找，删除后新record/job若碰旧sourceHash改用独立派生hash；新读回、回执、重试、恢复、Library与Planner来源排除已删项，跨owner/未知给中性404。OpenAPI/生成类型已同步，隔离PG探针增至23项并将独立升级探针扩至七项。当前仅本地Prisma schema/build/OpenAPI/typed lint、fixture路由1项与Planner12项通过，见`deletion-server-local-validation.json`；真实PG执行和完整CI待新提交。产品删除控件、Dock持久缓存撤权、活跃SSE残帧、对象清理和实际生产备份仍开放，不把服务端逻辑作产品完整删除验收。

`d55efe6`现已通过完整CI`36232326277`两job。隔离PG23项含跨owner中性404、worker lease栅栏、回执/重试/Planner撤权及同owner重提；独立旧record库按阶段升级七项含旧唯一键释放、原字段不变及作废后新活动键。两个产物提取后的HEAD与SHA-256核对一致，详见`deletion-server-ci-verification.json`。这不是既有库迁移、真实媒体对象清理或生产PITR证据。

当前工作树补产品删除流程：Home私有详情中二次确认，204后才撤下记录并刷新；网络结果不明保持未确认提示。成功删除同步清除相关Library/规划已选项，Dock停止所看流、移除重复job进度/FIFO并在严格IndexedDB事务删除本owner操作、checkpoint和批次外部输入claim；跨owner输入/草稿不清。404对账亦去除本机陈旧job，身份改变时取消/遮蔽迟到删除回执，迟到流帧被丢弃。当前本地移动Vitest297项+原生配置5项、12文件typed lint、类型与实际产品构建及Chromium B32/B33/B34三项通过，证据`deletion-ui-local-validation.json`。完整提交CI三引擎、真实IDB写失败后的重启遮蔽、跨进程活跃SSE残帧、对象引用/物理清理、旧库只读审计/回填、生产密钥/PITR、真实短链及双端设备仍开放；Story和T1–T5均保持in-progress。

`0ffc3e0`提交后CI`36233616834`的浏览器实际B00–B34/V01–V11在三引擎138/138全部通过，但校验器的固定`run-contract.json`未同步B34，浏览器job以`NOMAD_E2E_REQUIRED_MATRIX`失败；build-and-test成功，整轮仍失败。下载浏览器产物离线复现同一合同失败，报告/manifest SHA及HEAD见`deletion-ui-first-ci-failure.json`。当前工作树给合同追加B34，并针对T4发现的服务端SSE读取与写入间删除竞态，在每帧/重同步控制发送时重验owner/job并持有共享锁；隔离PG探针加入删除前可发与删除后不可发的双向反例，预期25项。当前仅server build、定向typed lint、handoff与82项回归通过，真实PG25项和完整CI待新提交，见`sse-deletion-local-validation.json`。

`a59b66b`已提交推送并在跑完整CI；其隔离PG探针25项尚未完成。后续工作树只扩充T4共享引用隔离反例：在新合成PG中两个owner引用同一CanonicalPOI及同一媒体对象键，删除A后核验B的Inspiration、POI与Asset行仍存且可读，预期探针26项。脚本独立TypeScript检查、typed lint及diff检查通过，实际PG待下一CI；不把相同对象键的行级检查当成真实对象存储访问、引用计数或物理清理。证据`shared-reference-local-validation.json`。

`a59b66b`完整CI`36234249586`现已两job通过。主隔离PG25项含当前owner SSE帧/控制可发、删除后排队帧/控制不可发，旧record分阶段升级七项；下载报告HEAD/提取文件SHA一致。浏览器归档离线校验三引擎138/138、33视觉、产品构建与源码绑定通过，详见`sse-deletion-ci-verification.json`。这验证合成库与浏览器场景，不验证真实对象存储、生产PITR或原生设备。工作树共享POI/Asset引用第26项仍待下一CI。
