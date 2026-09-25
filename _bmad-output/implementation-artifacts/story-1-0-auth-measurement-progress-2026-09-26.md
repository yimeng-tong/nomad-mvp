# Story1.0 WL-AUTH独立测量切片

Status: in-progress
Resume baseline: dd2a9700109425d2e80751e3ab4bf419c230af0f
Branch: codex/story-1-0-auth-measurements
Source contract: 1b2306196fb9b9ebc1284e3404004112349d7a0a352a1622bebf5a7188f77c4b

按bmad-dev-story恢复1.0 T9/METRICS-01；原baseline_commit7250a8a保留，中文/中等细节继承project-context；customization无prepend/append/on_complete。9.3本地gate及受影响集成已交付，真机和其余Story状态不变。当前没有本切片运行结果，后续按实际实施追加。

依据用户持续授权与近期计划第5步，真实资源不阻断独立测量代码。第三方平台/非密配置位置已另询问；正式法律/U-Link/设备及SDK关闭语义仍待核验，现有auth/owner/session/输入journal不重写，不以Noop或新测量报告关闭真实归因。

实施范围：复用已完成认证App/API和既有测量统计约定，提供公共版本化manifest、WL-AUTH精确workload/阶段/分母及可重算CLI；真实浏览器执行，所有PNVS/身份/API为显式隔离HTTP替身。分别记录发送、证明验证、身份/资格读取、受保护首页呈现、退出/未知退出恢复。分开正常/拒绝/未知/未结束/恢复，保留全部计划N、窗口/截止、重试和缓存模式；未知provider成本null，不预填真实staging阈值。所有输出重定位到新目录，不覆盖历史认证或1.6报告。


## 当前已实现与本地结果

公共MeasurementWindow/nearest-rank由认证与原导入共用，保留导入字段/公式；新WL-AUTH runner实际装载App/API client，12个固定样本及分阶段/分场景报告，CLI不覆盖已有输出。未知/失败/未结束与计划缺失保留，原operation只在内存比较，不写入样本。源码和public API/lock/实际浏览器在report中绑定。

实际发现AUTH_OTP_INVALID被通用401文案误报会话失效；现按错误code提示验证码不正确，单测证明输入保留、不自动重发、明确确认才第二次验证。真实浏览器相应场景通过。初始误报截图/失败日志留在/tmp旧运行目录，不把旧失败写成通过。

三层CR归并9项已修补/复核：浮点截止、实时deadline/阻止新投递、nonce body超时、clock UUID、排列不变性、分场景阶段缺失、可见首页、异常样本保留、源码不可读时保留。15认证统计/CLI+2实际harness体时钟+13旧导入统计通过；mobile266+5、99 typed lint/零例外、6门禁反例、handoff通过。当前5实际进程故障皆按目标拒绝且保留数据；preflight.json记录原始日志摘要和每轮来源。

正常R6为12/12：6成功、3拒绝、1未知、1不可用、1未结束，15实际HTTP写尝试；截止R2为1未结束/11缺失/1写入。它们在AM9前生成，源码摘要保留，最终提交CI将重跑整个当前版本，不将旧预验冒充最终源码。当前实际故障G2在AM9后验证，源码不可读仍保留12样本与可重算failed报告。旧导入15样本及重算相同证明统计兼容，不改旧报告。

操作说明docs/ops/auth-measurements.md，验收资料evidence/story-1-0-measurement-2026-09-26/。1.0/METRICS-01保持in-progress，T9真实验证/费用/目标及T8/第三方/双端未关闭，当前进入绑定提交的完整CI核验。
