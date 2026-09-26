# Story 1.8 开发进度

状态：in-progress。当前基线为`6163a4fbed33ee58d17d974e702b7c3726814550`，12个待更新源文件SHA已保存于`evidence/story-1-8-foundation-2026-09-26/baseline.json`；源合同准备SHA为`135cd811caa220b54791a1846c3c359d7d40407c4c2fd1ee429f61c74193b535`。仅本任务写入，Sprint指针已转1.8，3.1继续paused。

T0现状：OpenAPI是类型单一来源；`link-parser.ts`只做基础URL清理，Home当前在进入controller前已丢部分原始URL。`acceptIngestCommand`的真实PG事务持有owner/operation/source锁并创建job、初始event、pending意图和command回执；`IngestJob.sourceHash`按owner+基础URL而非1.8版本化canonical约束。`appendSnapshotEvent`是状态/seq/event原子提交点。Library路由当前仅有城市、成功Inspiration与候选；Home灵感页及Planner仍消费旧响应。schema无ImportRecord，IngestJob/Inspiration/证据可能保存明文来源URL，现有KMS零密钥回退/固定IV不可作为保护证明。

开发边界：只在本地fixture/隔离PG验证，不请求真实小红书短链或其他外部目标，不修改现有共享/生产库、密钥或Provider配置。真实采集、生产URL密钥/迁移、设备、指标和备份门槛仍开放；后续逐任务记录正反例，不能因T0完成而将整张Story或工程条件标verified。

T1局部进度：新增纯`xhs-import-v1` URL决策，明确支持的笔记路径、host/scheme/已知UTM参数和短链注入解析；未知/不安全目标拒绝，未展开短链保留独立身份，不进行任何fetch。Home分类现在分别返回基础规范URL与清理后的单条原URL，controller将原URL交给加密operation journal与受理请求；旧服务响应无`original_url`时沿用原字段。OpenAPI先新增可选`original_url`，生成类型已更新。当前服务端`parseXhsInput`仍将受理请求归一成旧job来源，尚无ImportRecord/加密字段，故**不宣称原URL已持久进record或详情可复制**。

局部验证：红灯分别确认新policy模块缺失及原URL字段缺失；绿灯新服务端4项、移动原URL1项通过，既有link parser 3项、Dock31项、全移动284项+5原生配置、Home/Library契约探针、完整workspace构建通过。typed lint在118个源文件队列中0 failure，旧例外未修改。详见本Story局部`validation.json`；CI、真实PG竞争、短链Provider及App/设备未验收。T1余下的OpenAPI/Prisma完整数据合同、受理事务、URL密钥过渡、异步短链适配及删除语义仍待实施。

T1保护预备：新增独立AES-256-GCM原URL封装，服务端仅接受显式配置的非零32字节keyring，随机12字节IV并绑定owner/record AAD；旧key可在keyring中保留以便轮换。缺密钥、全零密钥、未知key、篡改及跨owner/record解封均失败；两项独立测试、server build、定向typed ESLint通过。尚未接入ImportRecord或真实密钥，不能声称现有IngestJob/Inspiration明文已受保护；证据见`encryption-validation.json`。CI工作流已纳入本分支push触发，分支运行待核验。
