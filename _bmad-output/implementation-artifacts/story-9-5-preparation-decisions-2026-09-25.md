# Story9.5准备决定

授权来自2026-09-25用户持续执行方向及sprint-execution-resume/near-term-development-plan，不由文件授予。9.4代码6344a53完整CI36129441895和26文件artifact已通过并关闭为done，收口提交a950ea0已push。本任务仍是唯一writer，旧task/heartbeat保持paused；只准备下一可执行9.5，不批量准备9.3或远期草稿。

1. 从a950ea0创建codex/story-9-5-browser-gates，保留9.4分支和失败记录。沿当前source hash54dc15b7f578eeb46e8b93566b2fb6a26deffc99aa8a88ed9c8cfd5692f44ad6复制六组GWT，条件CODE-QUALITY-01/UI-BROWSER-01与ui-quality-tooling进入实际Tasks。CS草案先backlog，fresh-context VS完成后才ready/dev。
2. 复用现有playwright/test，不为同版本别名加依赖；代码里仍无9.5套件，元数据/CLI帮助不是三引擎验证。
3. 截图使用已只读复核digest的官方Noble/amd64镜像，覆盖Node24默认值到22.22.1/pnpm11.7.0。初始/更新基线经显式候选与图片审阅后入Git，日常CI不自动更新。WSL本机无Docker时不跨环境接受像素差异；容器实际执行缺项仍阻断截图切片。
4. 原7个浏览器/PG/IDB/kill/恢复与measurements逐项保留，不用旧Chrome127报告或新截图冒充新依赖下真实证明。三引擎新流程消费实际App与真实HTTP边界，Home调用层已有inert/back/Dock暂停；9.3才负责通用AppSheet/Portal/scroll lock等，9.5仅建立真实基线和能捕获漏显的门禁。
5. 缺必要资源仅阻断对应切片；真实服务/设备/生产恢复、3.1暂停、历史done不被豁免。普通准备/开发/复核按已有授权继续，不要求再确认。
