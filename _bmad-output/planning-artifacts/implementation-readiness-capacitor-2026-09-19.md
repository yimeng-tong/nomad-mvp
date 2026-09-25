---
project: nomad-mvp
date: '2026-09-19'
workflow: bmad-check-implementation-readiness
scope: approved-capacitor-amendment
scope_revision: capacitor-2026-09-19
status: passed-targeted-revalidation
readinessVerdict: READY
readinessScope: capacitor-local-implementation
productionReady: false
implementationAuthorized: true
storyCount: 62
gwtScenarioCount: 1052
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
inputDocuments:
  - docs/prd.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/supporting-tech-specs.md
  - _bmad-output/planning-artifacts/capacitor-scope-decision-2026-09-19.md
  - _bmad-output/planning-artifacts/app-implementation-prerequisites-2026-09-19.md
openFindings: []
runtimeGates:
  - macos-xcode-signing-and-ios-real-device
  - android-toolchain-signing-and-real-device
  - actual-app-identity-provider-and-analytics-evidence
  - apk-testflight-distribution-evidence
---

# Capacitor 定向实施就绪检查

## 1. 文档发现与来源选择

用户已经批准完整提案并授权自行决策、持续执行，本次依已有恢复顺序选择文档并自动继续常规菜单。此记录只评审已批准App增量及其与既有合同的接口，不重开全部页面审批。

| 类型 | 当前权威与镜像 | 历史/重复来源处理 |
| --- | --- | --- |
| PRD | docs/prd.md 与 planning-artifacts/prd.md | 必须字节一致；旧v0.1/v1.0草稿保留为历史 |
| 架构 | docs/architecture/index.md及当前shards（含app-host.md），architecture.md packet | packet是源文件组合镜像，不是另一份决策权威；根/v0.3/autoplace-v1仍排除 |
| UX | front-end-spec、mobile-ia、home-import-dock、prototype-coverage与ux.md packet | 旧delta和废弃native-save-share-r1不恢复；只新增宿主差异 |
| Story | 唯一epics.md及当前实际1.0合同 | 新9.1/9.2进入正式源；附录是获批升版依据，不独立派发 |
| Sprint | 新9月19日catalog/delivery及当前status/CURRENT | 旧9月15/17日迁移、授权、READY快照保持历史，3.1唯一继承不变 |

无缺失必需规划文件，也没有未解决的权威重复选择。修改前53个明确文件及哈希存于 `implementation-artifacts/archive/capacitor-scope-2026-09-19`。

## 2. PRD 分析

已全量提取66个FR、25个NFR，原文保存在[完整需求提取](readiness-capacitor-requirements-2026-09-19.md)。四项延期FR保持；新增FR52/NFR25明确三端、真实安装/分发和版本证据。FR1/14忠实承接既有PNVS决定；FR45/NFR16取消旧排除本期原生宿主条款；Web保存语义和App相册回执分开，原有账号/业务/位置/隐私边界保留。

额外约束为AR23/AR24、UX-DR36、三个APP工程条件、WSL/macOS构建分工，以及持续执行授权与决策记录。支持系统/手机方向已获批；未知签名/开发者资源是实施证据门槛，不是未定义的产品范围。

## 3. 逐需求覆盖与反向绑定

| 需求 | 范围 | 交付 Story | 工程条件 |
| --- | --- | --- | --- |
| FR1 | mvp | 1.0 | 所属Story绑定条件 |
| FR2 | mvp | 1.6 | 所属Story绑定条件 |
| FR3 | mvp | 1.6 | 所属Story绑定条件 |
| FR4 | mvp | 1.7, 1.9, 1.10, 1.11 | 所属Story绑定条件 |
| FR4.1 | mvp | 1.11 | 所属Story绑定条件 |
| FR4.2 | mvp | 1.11 | 所属Story绑定条件 |
| FR5 | mvp | 1.8, 1.11 | 所属Story绑定条件 |
| FR6 | mvp | 1.8, 1.9, 1.11 | 所属Story绑定条件 |
| FR7 | mvp | 2.11 | 所属Story绑定条件 |
| FR8 | mvp | 3.1, 3.2 | 所属Story绑定条件 |
| FR9 | mvp | 2.11, 3.1, 3.4 | 所属Story绑定条件 |
| FR10 | mvp | 5.1, 5.2, 5.3 | 所属Story绑定条件 |
| FR11 | mvp | 5.4, 5.5 | 所属Story绑定条件 |
| FR12 | mvp | 1.0, 7.3, 7.4, 7.5, 7.6 | 所属Story绑定条件 |
| FR13 | mvp | 8.1, 8.2, 8.6 | 所属Story绑定条件 |
| FR14 | mvp | 1.0, 1.6, 1.9, 1.11, 2.4, 2.7, 2.10, 5.4, 6.2, 8.1, 8.3 | 所属Story绑定条件 |
| FR15 | mvp | 1.0 | 所属Story绑定条件 |
| FR16 | mvp | 1.0 | 所属Story绑定条件 |
| FR17 | mvp | 1.6 | 所属Story绑定条件 |
| FR18 | mvp | 1.6 | 所属Story绑定条件 |
| FR18.1 | mvp | 1.8, 7.5 | 所属Story绑定条件 |
| FR19 | mvp | 1.6, 1.7 | 所属Story绑定条件 |
| FR20 | mvp | 1.8, 1.11 | 所属Story绑定条件 |
| FR21 | mvp | 3.1 | 所属Story绑定条件 |
| FR22 | mvp | 3.1, 3.4, 5.1, 5.4 | 所属Story绑定条件 |
| FR23 | mvp | 5.1, 5.3 | 所属Story绑定条件 |
| FR24 | mvp | 5.4, 5.5 | 所属Story绑定条件 |
| FR25 | mvp | 5.1, 5.4, 5.5, 6.4, 7.3 | 所属Story绑定条件 |
| FR26 | mvp | 2.3, 2.7 | 所属Story绑定条件 |
| FR27 | mvp | 2.3, 2.7 | 所属Story绑定条件 |
| FR27.1 | mvp | 2.3, 2.4, 2.5 | 所属Story绑定条件 |
| FR28 | mvp | 2.6 | 所属Story绑定条件 |
| FR28.1 | mvp | 1.9, 2.6, 2.11 | 所属Story绑定条件 |
| FR29 | mvp | 2.7, 2.8 | 所属Story绑定条件 |
| FR30 | mvp | 2.7 | 所属Story绑定条件 |
| FR31 | mvp | 2.7, 2.8 | 所属Story绑定条件 |
| FR32 | mvp | 2.9, 2.10, 2.11 | 所属Story绑定条件 |
| FR32.1 | mvp | 2.9 | 所属Story绑定条件 |
| FR32.2 | mvp | 2.9 | 所属Story绑定条件 |
| FR32.3 | mvp | 2.11, 2.12, 2.13, 2.15, 3.2 | 所属Story绑定条件 |
| FR33 | mvp | 2.9, 8.3, 8.4 | 所属Story绑定条件 |
| FR34 | mvp | 2.11, 2.12, 2.13 | 所属Story绑定条件 |
| FR34.1 | deferred | 明确延期 | 所属Story绑定条件 |
| FR35 | mvp | 4.1, 4.2, 4.3, 4.4 | 所属Story绑定条件 |
| FR35.1 | mvp | 4.5, 4.6, 4.7 | 所属Story绑定条件 |
| FR36 | mvp | 2.5, 2.11, 3.3, 6.1 | 所属Story绑定条件 |
| FR36.2 | mvp | 6.1, 6.2, 6.3 | 所属Story绑定条件 |
| FR36.1 | mvp | 2.11 | 所属Story绑定条件 |
| FR37 | mvp | 5.1, 5.2, 5.3 | 所属Story绑定条件 |
| FR38 | mvp | 1.9, 1.10, 2.9, 3.5, 5.1, 5.4, 6.4, 8.3, 8.4 | 所属Story绑定条件 |
| FR38.1 | mvp | 8.4, 8.5 | 所属Story绑定条件 |
| FR39 | mvp | 5.1, 5.2 | 所属Story绑定条件 |
| FR40 | mvp | 7.1 | 所属Story绑定条件 |
| FR40.1 | deferred | 明确延期 | 所属Story绑定条件 |
| FR41 | mvp | 2.5, 2.11, 3.3 | 所属Story绑定条件 |
| FR42 | deferred | 明确延期 | 所属Story绑定条件 |
| FR43 | deferred | 明确延期 | 所属Story绑定条件 |
| FR44-lite | mvp | 2.5, 2.15, 3.2, 3.3 | 所属Story绑定条件 |
| FR45 | mvp | 7.6 | 所属Story绑定条件 |
| FR46 | mvp | 6.4, 6.5 | 所属Story绑定条件 |
| FR47 | mvp | 6.3 | 所属Story绑定条件 |
| FR48 | mvp | 6.2 | 所属Story绑定条件 |
| FR49 | mvp | 1.6, 2.3, 2.5, 2.6, 2.7, 2.9, 3.1, 4.1, 4.5, 5.1, 5.4, 6.1, 6.4, 7.1 | 所属Story绑定条件 |
| FR50 | mvp | 3.5, 4.4, 4.7 | 所属Story绑定条件 |
| FR51 | mvp | 2.14, 3.4, 4.3, 4.4, 4.6, 4.7 | 所属Story绑定条件 |
| FR52 | mvp | 1.0, 1.6, 1.7, 2.9, 5.4, 5.5, 6.2, 7.1, 7.3, 7.4, 7.5, 7.6, 8.1, 9.1, 9.2 | APP-BUILD-01, APP-HOST-01, APP-DISTRIBUTE-01 |
| NFR1 | mvp | 1.0, 1.9, 1.11, 2.4, 2.10, 8.3 | 所属Story绑定条件 |
| NFR2 | mvp | 1.7, 2.9, 4.3, 5.1, 5.4, 7.4, 7.5 | METRICS-01 |
| NFR3 | mvp | 1.0, 1.9, 2.9, 5.1, 8.1, 8.4, 9.1, 9.2 | OPS-02, METRICS-01 |
| NFR4 | mvp | 2.9, 3.4, 5.1, 5.4, 8.1 | METRICS-01, METRICS-02 |
| NFR5 | mvp | 1.11, 2.11, 2.14, 3.4, 6.1, 8.2 | METRICS-01, METRICS-02, METRICS-03 |
| NFR6 | mvp | 1.0, 1.6, 2.9, 8.1, 8.2 | METRICS-01, METRICS-02, METRICS-03 |
| NFR7 | mvp | 1.0, 2.7, 7.4, 7.5, 9.1, 9.2 | OPS-01, OPS-02 |
| NFR8 | mvp | 1.6, 2.7, 3.1, 5.2, 6.1, 7.3, 9.1, 9.2 | 所属Story绑定条件 |
| NFR9 | mvp | 5.1, 5.3 | 所属Story绑定条件 |
| NFR10 | mvp | 2.11, 3.1, 3.4 | 所属Story绑定条件 |
| NFR11 | mvp | 4.1, 4.3, 4.4, 5.4 | 所属Story绑定条件 |
| NFR12 | mvp | 1.9, 1.10, 1.11, 2.8, 5.1, 5.2 | 所属Story绑定条件 |
| NFR13 | mvp | 1.9, 1.10 | 所属Story绑定条件 |
| NFR14 | mvp | 1.9, 1.10 | 所属Story绑定条件 |
| NFR15 | mvp | 7.6 | 所属Story绑定条件 |
| NFR16 | mvp | 7.6 | 所属Story绑定条件 |
| NFR17 | mvp | 1.9, 2.9, 5.1, 8.3 | 所属Story绑定条件 |
| NFR18 | mvp | 6.2 | 所属Story绑定条件 |
| NFR19 | mvp | 2.7 | 所属Story绑定条件 |
| NFR20 | mvp | 1.0, 1.8, 7.5 | DB-CHANGE-01, OPS-02 |
| NFR21 | mvp | 1.11, 2.8, 5.1, 6.3 | 所属Story绑定条件 |
| NFR22 | mvp | 4.3, 4.4, 4.6, 4.7, 5.4 | DB-CHANGE-01, METRICS-01 |
| NFR23 | mvp | 1.11, 2.4, 2.10, 2.14, 3.4, 6.2 | 所属Story绑定条件 |
| NFR24 | mvp | 8.5 | 所属Story绑定条件 |
| NFR25 | mvp | 1.0, 1.6, 1.7, 1.8, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.12, 2.14, 2.15, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.4, 7.5, 7.6, 8.1, 9.1, 9.2 | APP-BUILD-01, APP-HOST-01, APP-DISTRIBUTE-01 |

66个FR全部有交付或明确延期处置，其中62个MVP、4个延期；25个NFR均有责任。91项正反映射无缺失，历史done不作为新范围唯一交付证明。FR52的13个既有Story切片及9.1/9.2有明确任务，NFR25覆盖对应宿主责任。保留login/input attribution、analytics consolidation及map copyright，新增app-build-delivery。

## 4. UX 与架构对齐

当前UX文件存在且已同步源packet。平台声明、UX-DR36与app-host架构对齐：返回/键盘/safe-area、前台身份重核、受限外链、权限拒绝、真实保存回执和多端恢复都有所属Story和接口责任。Web精确下载文案、App相册保存、账号ZIP系统文件保存相互区分；5.5旧native草图不恢复。S0–S11、原18组提示、桌面运营和原业务数据合同保留。

现有页面继续复用；四组宿主差异已有明确文字状态合同，实施前以当前mobile-ia为基准逐项核对，不因未生成新整页图片阻塞纯宿主代码。真实键盘/安全区/权限/系统返回图像仍是9.1及各消费Story的关闭证据，不能用生成图片冒充。

技术研究发现Vite8默认iOS16.4与获批iOS16.0下限存在实施配置差异，已由D03决定显式target并列入9.1任务/测试；Android OS与WebView内核范围须分别说明。当前无未处置的规划对齐缺口；实际兼容性尚未验证。

## 5. Epic / Story 质量与依赖

- 全8个原Epic的用户价值与原业务边界保留；Epic9的结果是测试者安装/使用/更新App，不是只有依赖安装或数据库建表。9.1形成可安装的现有登录/协议入口，9.2形成真实分发结果；新数据库/业务插件不在9.1预建。
- 62个正式Story均有叙述、Requirements及结构完整GWT。新增14组来自两张新Story，20组进入13张既有Story；其他原业务GWT除已批准的1.0/5.5/7.6宿主/供应商替换外保留。脚本正按批准前快照和原附录验证全文，不能只靠数量通过。
- 保持历史ID而把9.1前置，是用户已批准的执行顺序；不采用按Epic编号大小推断时间的通用菜单规则。9.1不依赖1.0整体完成；1.0独立后端可推进，其App关闭依赖9.1；9.2最后聚合本期业务，依赖图无环。3.1的五项真实上游、当前合同和迁移审计原样保留。
- 9.1范围限最小宿主，插件按首次业务需求加入；9.2只承担分发/版本及候选回归，不再复制全部业务实现。已知原生登录/安全传输复杂性留在1.0独立wire ADR和原生插件，两个写入者已确认责任。
- 规划重大/致命缺口：0。实施风险：macOS/签名/真机与真实供应商证据未闭合；只影响对应构建/关闭，不能将其写成已就绪安装或Story done。

## 6. 最终判断与执行门槛

**READY，仅限当前批准范围的合同承接与本地实现。**重大/致命规划缺口0；构建资源/签名/真机、真实登录归因、最终测试分发等4类runtime gate仍开放。评审人Codex，2026-09-19；独立技术研究见9.1研究报告，不冒称其他人员完成全量审阅。

可继续：9.1合同准备、平台代码、原生工程生成和可用工具链验证；1.0共享后端与新版原生wire合同继续。不能宣称：双端安装/登录已通过、TestFlight已可用、生产开放完成。下一工作流按已批准顺序直接进入create-story 9.1 / dev-story，无需重复审批；无法绕过的资源缺项只阻断相关验收。

交接guard和回归检查的实际结果另追加本报告，不用此前旧READY-for-SP作为App就绪证据。

## 后续验证与执行（同日追加）

正式handoff校验通过9 Epic/62 Story/1052 GWT；guard60项回归通过，其中原43项完整保留。9.1已准备并进入in-progress，源8组GWT/绑定/任务及独立校验完整；定向readiness的READY仅用于本地实现，未改为生产/真机就绪。已实际执行workspace build并通过；mobile137项及Node配置proof3组通过。Native工程/配置/assets核验通过，首次Android骨架构建成功；后续认证依赖/API编译继续按实际日志修复，不用旧包证明最新代码。详情由9.1开发记录持续更新。
