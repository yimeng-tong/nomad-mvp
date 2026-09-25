---
project: nomad-mvp
date: 2026-09-13
status: user-confirmed
scope: subsequent-bmad-story-review-presentation
---

# Story 评审的对话展示方式

用户在确认Story 8.5时明确要求：仓库文件保持BMAD格式，对话中直接展示可读的文字
验收说明，不能只给“若干条GWT”的计数与文件链接。

后续每张Story在前台对话依次展示：

1. 简洁调研结论/采用建议及可追溯研究链接（该Story有调研时）。
2. Story编号、标题及As a / I want / So that。
3. Requirements。
4. 当前原型链接，说明合成/批准状态和生成提示保存位置。
5. “主要验收标准”下的中文编号列表：每条用自然语言说明行为、边界与失败恢复，
   不在对话中展开机械的Given/When/Then块，也不只列标题或笼统概括。

BMAD review/epics中的正式合同仍保留Given/When/Then/And。对话说明应覆盖同一合同，
保持编号可追踪，不能因通俗化丢失关键条件或扩大范围。链接作为补充，不替代前台文字。

用户所贴旧Story 7.6/8.2内容仅用于举例展示形式。不能据其文字恢复旧的截图失败专用
按钮、统一硬规则否决、Langfuse仅可选摘要等已被后续批准内容取代的方向。
8.5本次确认仍有效，不重新请求同一批准。该决定存于项目规划文档，不修改全局记忆或技能文件。
