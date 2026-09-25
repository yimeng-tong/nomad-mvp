# Story9.5 独立代码审阅与修补

范围：9.4完成基线a950ea0至本Story当前代码、测试和CI；初次代码/配置/ops差异2399行。24个PNG由初始候选审阅记录独立核验。bmad-code-review流程采用无会话上下文的Blind Hunter、Edge Case Hunter、Acceptance Auditor，同等模型能力；全部只读，主任务唯一writer。

归并后8个patch，0decision/0defer/0dismiss。持续授权覆盖普通修补，无需新菜单确认。当前均已代码修补、相关本地验证和三层定向静态复核；最终93项v2/新反例/CI和下载产物尚待通过，Story仍in-progress。

| ID | 来源 | 问题与最终修补 | 当前证据 |
| --- | --- | --- | --- |
| R1 | edge | 报告树负例传report对象→report.suites；独立离线模式必须明确真实CI SHA/下载目录 | 对f53d实际90项报告，4个CLI完整性负例均目标失败；该审计不执行新产品流程 |
| R2 | edge | inert不隐藏可见输入值；分别查visible/interactable values，补inert+aria-hidden漏显 | 单inert原ARIA会捕获，组合故障原oracle实测错误通过；新visible-value断言失败，有trace |
| R3 | edge | /me旧A、新B不可同批释放只看最终B | releaseNewest先B可见，再释放A及两帧后继续断言B/无A |
| R4 | 三层合并 | 补整个mobile、native-auth、HTML/public/tsconfig等输入；图谱/bytes不可覆盖归档，当前dist复用9.4隔离检查 | 41个local modules全绑定，v2实际源/产物5个变更反例待最终CI |
| R5 | blind | HTTP routing未覆盖WebSocket | routeWebSocket拒绝且不connectToServer；5个网络故障/2控制本机通过 |
| R6 | blind | OTP verify只校验静态验证码 | 必须匹配成功start的手机，缺失/未start/错配/错误OTP均拒绝；B22实际合同控制通过 |
| R7 | blind | noopener空引用不可判断成功或被阻止 | 保留安全打开并提供48px当前页法律回退；B09实际导航通过，window.open=null明确为替身 |
| R8 | edge | visual ID可通过但漏图片附件 | 每engine×visual要求一个实际PNG、限定本run路径并重定位下载文件；缺附件CLI反例通过，v2当前附件待最终CI |

定向复核：blind明确5项均闭合；edge确认R2/R3/R4/R8及walker闭合，返回空发现；acceptance复核source图谱41项无遗漏、文档镜像一致，并实际只读验证旧SHA审计标明contractVersion1/compiledProductVerified=false，不将其当v2证明。

本地23项Chromium和23项Firefox、242移动+5native配置、18组件、typed lint、native sync/verify、7项污染检查及handoff通过。local report源清单在native sync后再逐hash核对一致。详见evidence/story-9-5-browser-2026-09-25/review-local-validation.json；真实服务、最低平台、AppSheet Portal、TestFlight和生产恢复门槛保持。


2026-09-26最终实证：85eedb6/run36157432347两job全通过；93项v2、5网络/5产品/4报告/5构建/3配置负例及正控全部实际通过，777下载文件、12trace和24actual PNG复核。8项修补完成验证，无未解决审阅项；旧版本离线审计不用于替代本次v2。
