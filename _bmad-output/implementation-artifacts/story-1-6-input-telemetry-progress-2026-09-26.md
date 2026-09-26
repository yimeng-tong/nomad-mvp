# Story1.6 规范输入事件接线

Status: in-progress
Resume baseline: 0830c7909c7f8200ace948c451ea6f0b55c815f3
Branch: codex/story-1-6-input-telemetry
Source contract: a6ce5304455dc1883ad6641bcd2a5d0f1943364f5a53e93a8cf208779f9724df

复用现有1.6合同/T6、1.0许可运行时与nomad.telemetry.v1字典；已完整核对当前源码、进度和docs/front-end-spec.md Analytics，四个规范事件是home_input_classified、ingest_job_created、ingest_presented、import_record_opened。此前只有字典，controller没有实际发射器。bmad-dev-story无prepend/append/on_complete，中文/中等细节与主任务一致。未重新准备Story、未批量准备1.8。

已在现有Controller/Home接入submit、分类回执、真实created mutation、Dock layout ACK和结果Sheet可见内容五个消费点。输入/来源仍由原controller/journal/cursor决定；事件不创建或重交业务操作，后台终态不算呈现。先捕获绑定的analytics与auth scope，再异步读取/计算；checking、换owner/session或撤回许可后，旧绑定不能借新上下文发送。默认App供应商出口仍未接通，只完成生产调用边界与隔离投递。

事件引用只从服务端现有随机UUIDv4 job、明确事件种类及适用attempt派生，源不含owner/session、URL或私人文本；固定profile的SHA-256 UUIDv8使重放使用同一引用、不同事件/attempt分离，不冒充随机UUIDv4。精确算法、向量、边界和缺项见`docs/ops/input-telemetry-v1.md`。RFC9562 5.8与B.2允许SHA-256派生的v8，唯一性由具体方案承担；本引用不是认证/删除证明。依据：https://www.rfc-editor.org/rfc/rfc9562.html#section-5.8；https://www.rfc-editor.org/rfc/rfc9562.html#appendix-B.2。

实际App/Chrome127隔离探针于本分支通过：5类事件的网络信封分别在明确提交、当前分类、确认创建、Dock实际显示、已读可见结果处出现；未知许可不外发，后台完成或被遮挡的卡片不算呈现。同一许可代次内重复展示由本地runtime去重；撤回再授予后，同一事件ID再次发出，实际供应商去重及查询仍未验证。旧结果不能借新代次，owner A→B迟到分类被丢弃。探针使用真实App/IDB/WebCrypto/布局和显式HTTP/身份/许可/遥测替身。1次fixture写入，0真实供应商调用、0外站请求，序列化信封未含私人哨兵、URL、owner/session或原job ID。浏览器结果和当前源码SHA已在本地核验，并将由CI复验；仓库证据见`evidence/story-1-6-input-telemetry-2026-09-26/`。此为隔离浏览器证据，非真实SDK、查询、原生许可或双端设备验收。

三层限定审阅发现浏览器探针缺精确计数、Dock布局ACK先于实际可见、异步适配器拒绝Promise三项可修问题；已加入精确计数、遮挡/视觉视口命中检查和拒绝Promise收口。聚焦测试与实际浏览器遮挡反例通过。新增CI独立步骤和产物上传。仍需完成真实SDK停止/清缓存策略、版本化真实同意界面、U-Link/U-App账户与查询、原生设备、实际Staging/METRICS-02目标及T7剩余关闭条件。Story1.6和APP-HOST-01/METRICS仍in-progress；3.1继续paused。

该变化不新增SDK依赖、业务字段/数据库或journal迁移；输入/分类即时事件与每次真实查看使用独立随机事件ID，业务重放相关事件使用派生引用。已有SDK停止/缓存、正式法律/U-Link/匿名关联、实际查询和双端资源门槛仍open；没有真实供应商请求/短信或部署，1.0/1.6/1.7/9.1/9.3仍in-progress，3.1paused。
