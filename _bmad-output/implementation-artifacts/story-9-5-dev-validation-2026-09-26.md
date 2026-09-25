# Story9.5 Dev/Review关闭检查

Definition of Done: PASS（仅本Story范围）。

- 上下文/源六组GWT、AR26/UX-DR37与ui-quality-tooling及两项条件完整承接，源合同hash不变。
- T0–T8和8个Review Patch全部完成；没有未勾任务或缺失实际File List。
- 93项三引擎、24基线比较、各层实际反例/正控、typed lint与原完整CI通过；构建/依赖/renderer都按固定版本核验。
- 原auth6与真实PG/SSE/IDB6定向重跑，保留28旧证据；未重跑职责不伪称通过，零真实Provider调用。
- 777实际下载文件、12trace与24actual PNG、CTA实际/预期/diff核验，source/bundle/资源摘要和失败历史保留。
- 三个独立CR层均完成，8项归并修补后定向复核无剩余明确问题；无决策待用户输入。
- ui-delivery.yaml只关闭本Story CODE-QUALITY-01/UI-BROWSER-01；真实原生/最低平台/供应商/生产恢复及3.1暂停不变。
- Story/Sprint/CURRENT/monitor完成review→done，两次ci:handoff均通过；guard未修改，不增加无关回归。heartbeat保持PAUSED，下一仅9.3 CS/VS。

适用范围：无新业务领域核心算法；新增工具逻辑由实际CLI/浏览器/负例验证，不添加同义实现的空单元测试。ALL existing tests指本合同要求的完整CI及受影响独立探针，其他真实资源门槛未转为passed。技能一般性production consideration不构成发布/设备/真实服务验收。
