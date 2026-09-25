---
project: nomad-mvp
date: '2026-09-25'
scope: story-5.1-through-5.5-and-6.1-through-6.5
workflow: bmad-create-story
status: draft-contracts-under-preparation
implementation_started: false
context_commit: 7250a8a131a370698bff53538a4405c2ddb94c1c
context_branch: codex/story-1-0-production-auth
authorization: _bmad-output/implementation-artifacts/all-story-preparation-decisions-2026-09-25.md
---

# Epic 5/6 准备研究与逐 Story 保存记录

本记录只证明源/代码/官方资料的准备核对，不是运行、独立 review、真实供应商、设备或生产验收。准备涉及 10 Story、220 GWT；当前源为 ui-foundation-2026-09-20。普通合同保持 Status draft、preparation_status drafting，主任务统一复核推进。没有安装依赖、修改实现、调用真实服务或修改 CURRENT/Sprint。

## 权威来源与边界

- 已读 CURRENT、project-context、完整 Sprint、当前 migration/catalog/delivery 的对应条目，以及 epics.md 的完整 Epic 5、Epic 6 正文。
- 技能：`.agents/skills/bmad-create-story/SKILL.md`、checklist、discover-inputs、template；customization resolver 无 prepend/append/on_complete，persistent project-context 已读。
- 当前架构：`docs/architecture/{data-models,rest-api-spec,frontend-architecture,backend-architecture,app-host,ui-foundation,frontend-data-navigation,tech-stack,mvp-implementation-checklist}.md` 的适用职责与合同；`docs/front-end-spec.md` 的 Meals and Checklist、Detail/Result/Export、CE-03 与 UX-DR37；`docs/ux/prototype-coverage.md` 的当前/被替代原型标记。
- 原 PRD、已批准 shopping-intent-scope-review 与 source GWT 一致：6.5 仅文本标签；购物找店、属性、多门店、清单转排期和 7.2 check-in 仍延期。
- 5.1 必须独立交付 S7→最小 S10→S9 实际鉴权来源→原 S10 日期/scope/滚动/焦点；5.2 不能成为前置。5.4 必须独立交付可鉴权下载的城市图片，不等待 5.5。
- 5.5 较早 Web-only GWT 的“非原生”排除只限定 Web/PWA 分支；同一正式源的后附 C10/C11/C12 和已批准 App ADR 明确加入 App 相册与分享。本次完整保留两段，并在 Tasks 按宿主区分，不能删掉任一分支。
- CURRENT 的 stop_after_story1.7、资源阻断与 3.1 paused 保持；缺资源写为具体实施/关闭门槛，准备不替其验收。

## 当前工作树事实

下述文件已读取其完整正文；OpenAPI 则按本领域既有 fill/export、planner 和 error/owner 合同定向读取，实施前对变更区及关联 schema 再完整核对。不是从旧 HEAD 推断现状。

| 文件 | 现状与实施含义 |
| --- | --- |
| `apps/server/src/application.ts` | 集中注册现有路由；真实 PersistentAuthService 模式下 `/plan/ai-fill`、`/sse/fill/:runId`、`/export/png` 返回 FEATURE_NOT_AVAILABLE。fixture fill 用 timer、固定 payload，并把 runId 传给接收 planId 的 persist helper；不能放开开关当生产交付。迁移为领域路由时保留启动认证、错误 envelope、CORS/CSRF、安全日志与其他路由。 |
| `apps/server/src/fill/service.ts`、`validator.ts` | 直接先建 status=done 的 FillRun，再循环写 FillItem，无事务/owner/revision/attempt；验证器只包装 AJV。必须迁移单一 FillRun 权威、事务 terminal 发布、槽位级验证与恢复。 |
| `packages/prompts/schemas/fill-output.schema.json` | do 无 minItems；没有拒绝未知字段、why、citation、精确 revision/slot scope。5.1 需严格输出 schema 和服务端安全规范化；5.3 用户原文校验不能沿用 AI 裁剪。 |
| `apps/server/src/export/renderer.ts` | Puppeteer 打开只含 Plan id 的空白模板、固定 1920 viewport；返回 data URL 的 day=1 文件，sliceByDay 参数未形成可用城市导出。保留 browser finally.close 与 WebP/JPEG 能力，替换快照/城市单元/私有 artifact 边界，禁止把占位截图当预览证据。 |
| `apps/server/src/schemas.ts` | 现有 AiFillBody 只有 plan_id/dry_run；ExportBody 保留 slice_by_day/light-dark/宽度字符串兼容输入。新路径须 strict owner-revision DTO；兼容输入不能使按日导出重新成为公开产品合同。其他规划边界校验保持。 |
| `packages/prisma/schema.prisma` | 存在 User/Session、Plan/PlanVersion/PlanDay/PlanSlot、EditEvent、FillRun/FillItem/ExportJob；FillRun/ExportJob 缺目标 revision、owner 显式约束、attempt/event/manifest。没有 TripRevision、MealSlot、BusinessArea、TripChecklist、SlotDetail/Override 完整模型；目标名称不能假设已存在。 |
| `apps/server/src/routes/plan.ts` | 现有 owner reads、expected plan rev、operation id/request hash、编辑/undo、计划恢复与 authorized SSE；仍是 Quick/HQ 历史合同。5.x 新只读页面不能启动该 generate 路径，6.1 应消费将由前序升级的统一 mutation/validation/Trip 原子能力。 |
| `apps/server/src/planner/{service,types,repository}.ts` | service 使用 accepted-owner authority 和 attempt；repository 提供现有 plan/job/version/edit/undo interface，尚无 MealSlot/linked Trip。复用 authority 及接口风格，新增餐饮职责不能复活 Quick/HQ 产品入口。 |
| `apps/server/src/integrations/amap.ts` | 受限同城文本搜索，nullable 坐标/距离；无坐标系字段、周边餐饮评级/免排队/BusinessArea 可靠关系。不能把 distance_m 当权威 RouteFact，也不能从地址文本构造商圈。 |
| `apps/mobile/src/App.tsx` | 当前 Home/Settings/Planner 切换；owner/session/nativeGeneration 变更清视图，统一 /me 恢复/遮蔽/退出对账。无 S9/S10/S11；后续 typed Router 接入不得绕过该恢复权威。 |
| `apps/mobile/src/planner/DayPlanScreen.tsx`、`api.ts` | 现有日 Tabs、POI行、HotelFooter、编辑/撤销和受身份约束的 typed client；Quick/HQ/seed 属待前序迁移基线。无详情/导出/餐饮/清单。5.1 计划级入口不占时间轴纵向空间；6.4 rail 图标不挤占横向日期。 |
| `apps/mobile/src/auth/transport.ts` | 每客户端捕获 auth scope，epoch/activity fencing、abort 和 native cancel；移除 JS credentials，并发送一致性 header。领域 client 复用，不把 owner id 当认证，不自建 fetch/native HTTP 绕过。 |
| `apps/mobile/src/platform/host.ts`、`host-runtime.ts` | 唯一 keyboard→Sheet→page 返回分派，resume sequence、listener 清理和安全外链；公开接口主要是 resume，没有业务定位/保存接口。6.2 需在现有生命周期层提供可取消 foreground scope，不能只订 resume 而漏 background 失效。 |
| `packages/native-auth/src/definitions.ts`、两端 `NomadNativeAuthPlugin` | 已有下载 expected owner/session/generation、50 MiB 上限、SHA256、MIME、私有 cache handle；切身份/重启会清 cache。无相册/分享/用途有界 handle resolve/release 接口，不能把 handle 返回当保存成功。5.4 需补文件消费/清理协议，5.5 单独消费 MediaStore/PhotoKit。 |

最近五个提交为 7250a8a/534581c 的旧 2.2 编辑与 CI、10f940c 的真实 planner persistence、1a03e88 的 Quick/HQ、6f8aeec 的 2.0/2.1 准备。当前工作树有大量后续未提交认证/原生/恢复代码；不能 reset/clean 或以 HEAD 覆盖。前序合同本批准备不等于前序功能完成，实施入口重新核对源码和证据。

## 版本及官方 API 核对（2026-09-25，只读）

本仓库 React/DOM19.2.7、Vite8.0.16、Capacitor core/android/ios8.5.2、Vitest4.1.9；lockfile 为 Puppeteer22.15.0、Prisma5.22.0、AJV8.17.1、Zod3.23.8/3.25.76。不为“最新”升级；新插件实施前核验精确版本、peer/最低平台/许可证/隐私声明并锁定。新 UI/Query/Router 消费已批准 ADR，不在这十份合同重新选框架。

| 范围 | 官方依据和采用结论 |
| --- | --- |
| 5.4/5.5 渲染 | [Puppeteer ScreenshotOptions](https://pptr.dev/api/puppeteer.screenshotoptions) 说明 fullPage、quality、format 接口；网页当前是25.12.0，不能视为22.15.0已验证。实施须同时核对锁版本本地类型/浏览器 revision。API 文档不能给设备安全大图上限；实际 WebP/JPEG 解码/内存矩阵是 active policy 门槛。 |
| 5.5 Web分享 | [W3C Web Share](https://www.w3.org/TR/web-share/)：files 能力逐数据检测、用户手势/安全上下文；系统 handoff 是可观察边界，不是接收者收到。取消正常结束；不传签名URL或身份凭据。 |
| 5.5 浏览器保存 | [File System Access](https://wicg.github.io/file-system-access/) 只在实际支持/授权路径使用目录写入；按写入和关闭完成判定。普通下载没有同等回执，严格文案“已开始下载，请确认”，保存未知与失败分开。 |
| 5.5 Android | [MediaStore](https://developer.android.com/training/data-storage/shared/media)：Android10+自己新增媒体不需为了此操作申请读取其他应用媒体；写入使用 pending→完成发布与失败清理。不能从 file cache 成功推导相册保存。 |
| 5.5 iOS | [PHPhotoLibrary](https://developer.apple.com/documentation/photos/phphotolibrary?language=objc)、[addOnly](https://developer.apple.com/documentation/photos/phaccesslevel/addonly)、[用途声明](https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryaddusagedescription)：限定 add-only 与 performChanges completion；两条符号页面为 JS 文档壳，具体签名需实施时在 Xcode SDK 核对。不能借此声称已运行或存入相册。 |
| 6.2 定位 | [Capacitor v8 Geolocation](https://capacitorjs.com/docs/apis/geolocation)：getCurrentPosition 单次、timestamp/accuracy、check/request permission；v8.0.0起有 enableLocationFallback，Play Services 检查失败可走 Android LocationManager。必须在实际锁版本及无GMS设备证明；失败继续计划基准。依赖自身涉及额外 iOS用途字符串时核对最小声明，不请求 Always、不启用后台模式。 |
| 6.2 坐标 | [W3C Geolocation](https://www.w3.org/TR/geolocation/) 与 [AMap 坐标转换](https://lbs.amap.com/api/webservice/guide/api/convert)：显式记录 source/coordinate system，AMap转换按输入类型，不能把WGS84当GCJ-02或重复转换；调用只处理单次短时数据，转换不可用即诚实降级。 |
| 5.1/5.3 Unicode | [ECMA-402 Segmenter](https://tc39.es/ecma402/#sec-intl-segmenter-constructor) 作为用户可见字符边界依据。AI安全裁剪与用户拒绝超限是不同规则；实施固定算法/Unicode行为并测组合字/emoji/换行，不靠JS .length。 |
| 6.5 IME | [W3C UI Events composition](https://www.w3.org/TR/uievents/#events-compositionevents)：组合输入状态需要显式处理。快捷标签延后至 composition end或保留组合内容，再更新 selection；真实中文键盘验证不能由jsdom模拟事件替代。 |

以上为准备适用依据，不引入在线 API 调用、下载插件、硬编码最新版本或假兼容声明。每条官方来源只作短适用说明；详细实现以其锁版本 API 和本项目源合同核对。

## 资源门槛

- 5.1 仍缺 S7→最小S10→S9来源/状态→原S10 连贯 UI checkpoint；已批准 Overall Check R1只能约束入口层级。旧5.1 detail-entry R1不能代替该门槛。
- Provider、AMap、私有COS真实样本/能力/配额与调用授权在实施前确认；没有发出真实请求，没有以环境变量存在为能力实证。
- 最低 iOS/Safari16.4、Firefox128、Android10/WebView111 及无GMS/设备内存档位矩阵，macOS/Xcode/签名和真机资源目前未在本准备验证；阻断依赖验收而非合同写作。
- 用户正式基线/体验与费用目标尚需 METRICS-01/02；不猜N、成功率、毫秒、字节安全阈值；600KB为城市图片尽量目标，不能当整趟安全上限。
- `/home/tong123/work/厦门旅游规划/output/行程单_final.md` 已核验存在，只作为 PRD指定格式/QA参考；正式实施应使用获准脱敏 fixture及独立输入manifest，不把该文件当实时用户计划或生产来源。
- 私有对象清理、共享引用、迁移恢复、生产PITR继续各自门槛；本次不操作现有数据库、对象或秘密。

## 逐 Story 保存进度

合同和自查验证将逐项写入；root 后续独立 review 的结论不在此自查冒称完成。
