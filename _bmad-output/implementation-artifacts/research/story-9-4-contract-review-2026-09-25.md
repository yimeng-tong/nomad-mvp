---
project: nomad-mvp
story_id: '9.4'
date: '2026-09-25'
kind: fresh-context-story-contract-review
workflow: bmad-create-story/checklist.md
status: passed
scope_revision: ui-foundation-2026-09-20
reviewed_story: _bmad-output/implementation-artifacts/9-4-component-workbench-and-enforced-code-quality.md
reviewed_story_sha256: 6320593e4ce0a093371ca7e6f0b15cd3fb537f60a81723dd00bd0d2b4a052a1c
source_contract_sha256: a120d2b064bfa7ba8a362f51aee771e61db8c04083817f7366250ae4d55adf27
reviewed_story_status: draft
open_findings: []
required_corrections: []
implementation_performed: false
state_changes_performed: false
---

# Story 9.4 独立合同验证

结论：**通过本次准备合同审阅；没有发现需要修正的具体遗漏或矛盾。** 当前 `draft` 是主任务完成验证前的有意状态，不列为缺陷。本报告只支持后续准备收口，不是工具实现、CI运行或开发派发许可。

## 核验来源与方法

按 `.agents/skills/bmad-create-story/checklist.md` 在独立上下文审阅当前实际 Story；重读 CURRENT、project-context、Sprint、当前1.7合同及9.1既有宿主边界。完整核对 `epics.md:7004–7451` 的 Epic9，包括9.4的正式源 `7226–7278`，并读取现行 ui-foundation-2026-09-20 catalog/delivery、批准决定、定向 readiness、UI实施前置、`docs/architecture/ui-foundation.md`、`frontend-data-navigation.md`、`docs/ops/ui-validation.md` 和相关UX/代码标准。

两份当日输入 `story-9-4-tooling-research-2026-09-25.md`、`story-9-4-repository-context-2026-09-25.md` 已读取；抽查根/移动端 package.json、HomeSheet、LoginScreen、实际 handoff/UI检查器与Git历史，确认它们没有把候选依赖、占位lint或未提交实现误写成已交付。已发布工具API的版本细节采用研究记录的固定官方来源证据；本审阅没有重复安装或运行这些工具。

只读 Python/YAML/hash 对照共 **21项通过，退出码0**：六组GWT的24行逐字相同；叙事三行、Requirements、范围及Code quality补充逐字相同；源段SHA与Story/catalog一致；FR/NFR、工程条件及来源义务集合完全一致；实际Tasks含两项条件与来源义务且没有已勾选实现项；依赖、派发和当前状态边界一致。

收口前重读主任务补充后的当前稿并重跑21项对照。补充明确了实际文件目录、受控手工接线及captcha边界：`LoginScreen.tsx:242–259` 的aliyun-pnvs分支确实直接调用requestPnvsCaptcha，不消费getCaptchaToken；现行T2及Dev Notes已要求工作台MSW配置固定fixture provider，含误配真实provider及worker不可用时无SDK/外发的负例。该补充保持产品guard和源GWT不变；本报告SHA对应补充后的draft。

最终限定复核覆盖主任务采纳的四项说明：T2在交互前拒绝非fixture captcha provider；MSW使用固定脱敏失败出口并以合成query/body哨兵检查日志；T6取得可解析的PR/push比较基准，bootstrap仅区分未变旧文件而不永久豁免后续改动；T5比较dist与两端完整资源清单以捕获native目录额外残留文件。这些分别具体化原AC2/6、AC3/4及AC6，不新增源验收或9.3/9.5前置。21项源文本/hash/绑定/范围/停止边界对照再次全部通过；仍无待修正合同发现。本报告SHA已更新为上述说明全部纳入后的稳定draft，后续仅Status/完成记录变更由主任务准备收口记录。

## 验收责任逐项对照

| 源验收 | 实际任务与关闭证据 | 判断 |
| --- | --- | --- |
| AC1 可立即运行的现有组件与状态 | T1直接消费HomeSheet/LoginScreen，现有CSS与适用状态；T4真实组件交互；T6干净安装、启动/静态构建；T7逐AC证据 | 已承接；不等待9.3新增组件 |
| AC2 合成MSW及未声明请求失败 | T2按生成DTO/安全错误建立浏览器和Node共享handlers；worker就绪/失败、严格静态白名单、收尾失败账本、业务catch负例和场景清理 | 已承接；没有用网络替身替代native/PG |
| AC3 真正typed lint与三类负例 | T3唯一flat config、真实TSProgram/覆盖核对、Promise/Hook/无名称字段规则及修复后的退出结果；T6实际CI入口 | 已承接；不是安装插件或重复tsc |
| AC4 精确依赖与不可增长旧债务 | T0解析peer/engines及工作树基线；T3逐诊断冻结、同数量替换/移动复制/ignore等绕过限制；禁止大批业务改写 | 已承接；保留现有React/Vite/Capacitor及业务权威 |
| AC5 交互/a11y能发现缺陷 | T4独立Chromium组件运行时、焦点/键盘/错误关联和反例，axe error及实际人工检查结果；T7对应源码 | 已承接；不宣称读屏/真机验收 |
| AC6 产品产物和transport隔离 | T5检查入口/模块来源/文件清单/运行网络/worker及双端同步资源，含污染负例；T6接实际CI，T7保留环境限制 | 已承接；不以devDependency分类代替产物证明 |

`CODE-QUALITY-01` 由T0/T3/T6/T7、`UI-WORKBENCH-01` 由T1/T2/T4/T6/T7落实；`ui-quality-tooling` 的工作台、真实lint、旧探针对照和产品隔离由T0/T2/T5/T6/T7承接。FR52、NFR3/7/8/25的本Story责任分别落实为跨端产品隔离、无秘密/真实外发、现有状态与无障碍验证和可追溯证据。没有把这些要求扩成完整App发行或其他Story验收。T7及Dev Notes明确两项首交付条件必须实际verified，不能用not-applicable豁免；ui_delivery_evidence格式与当前检查器一致。

## 范围与状态判断

- Catalog的9.4依赖为 `[]`，实际合同相同。复用已有9.1宿主接口和现有组件即可；没有要求1.0/1.7/9.1整张done。9.3共享层、AppSheet、Tailwind、Query9.6、Router9.7及9.5多引擎产品流程/截图均未被提前纳入。
- Playwright只承担9.4单Chromium组件执行；9.5仍拥有跨引擎产品流程/截图、旧浏览器脚本等价替代和UI-BROWSER-01。两项范围没有形成循环依赖。
- Story保留HomeSheet现状与9.3能力边界；工作台不挂生产main/HostBootstrap，不替换auth transport/controller/journal/cursor，不借lint清理重写领域实现。允许修复样例发现的窄缺陷时要求限定行为及回归。
- 审阅时CURRENT仍为1.7 in-progress，CURRENT/Sprint的stop_after_story均为1.7；3.1仍paused，七条历史done仍保留。9.4为draft/Sprint backlog，next_story_to_prepare仍为9.4，符合验证中状态。主任务后续可按既有准备授权收口ready-for-dev与队列指针，不能据此开始实现。
- 当前研究、mock、配置和未来本地测试均不关闭APP-HOST-01、UI-COMPONENT-01、UI-BROWSER-01或其他Story条件；缺Mac/签名/正式账号不是本工具切片的开发前置，原真实验收门槛保留。

未修改Story、源合同、CURRENT、Sprint、依赖、产品源码或检查器；未运行安装、Storybook、ESLint、构建、真实服务或原生设备验证。本次唯一写入是本审阅报告。
