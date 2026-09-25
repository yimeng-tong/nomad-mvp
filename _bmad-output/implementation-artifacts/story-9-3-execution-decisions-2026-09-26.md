# Story9.3 执行决定

2026-09-26：按9月25持续授权，823fd85准备基线提交推送后进入DS；五条件按本Story自身证据推进。保留baseline_commit775b132及全部历史，准备提交另记。唯一writer为当前WSL任务；原任务与heartbeat不恢复。

T1选择逐件记录并复制shadcn Base UI registry源码作为实现起点，Nomad维护公开API。CLI固定4.21.0，基础显式base；不执行覆盖型init，不引入全局Preflight或示例主题。必要辅助依赖依据实际保留代码逐项审计，未使用的图标/动画/class库不安装。后果是手工差异须可追溯，而不是宣称完整保留生成器外观。

品牌、原领域状态/transport/journal/cursor与宿主协调器不转移到组件层。样式先独立接入，随后按T2–T5逐消费面修改；本地UI证据与真实设备要求分别记录。

T3实际固定版源码发现useScrollLock只跟随open而不等待mounted。采用受控presence：logical close后保留唯一Base UI Root为open，原弹层inert并播放260ms退出，等Popup/Backdrop实际Web Animations完成才卸载；不存在第二个手写锁。身份核验则立即移除整个Root。后果：Home onClose领域通知延至实际退出完成，原已确认操作仍只走既有controller；工作台/三引擎必须证明这段期间FIFO和焦点/背景行为。

Toast.Close的1.8默认在未展开时aria-hidden；Nomad只展示一条非关键通知，显式保留可读关闭按钮，保持礼貌播报/不主动聚焦。实际工作台首轮失败保留，复跑才算通过。

B05实际浏览器进一步暴露Base UI1.8 markOthers对所有[aria-live]的保留策略；Home Dock包含此类节点，所以默认逐节点隐藏无法满足整页背景不可读。PrivateUiBoundary现按实际present层计数对整个页面兄弟节点设inert/aria-hidden，Portal在兄弟容器；不增加另一focus trap/scroll/back管理器。该修改后Chromium29/29、263移动/5配置和工作台30/30通过。T6早期完整16反例通过是在这一额外mask修改前，最终当前CI会重新跑全部反例。

候选矩阵扩至B00–B28与V01–V11，共120项/三引擎；保留原93项责任。V09/V11使用320×740，V10使用1280×900，policy/run-contract双登记，capture校验真实page viewport、window尺寸及DPR。新的actual-viewport-drift反例使用真正page.setViewportSize改变尺寸，不能由同一份project配置假通过；等待实际canonical CI执行。


本地收口决定：基于aeadc1e实际完整CI36184294356、下载产物及原探针，登记四项UI条件与local gate verified；背景是合同允许局部依赖，后果是9.6/9.7将来可消费此证明，但整張9.3仍受T9/APP-HOST-01限制，当前队列先做在制集成。未放宽阈值/原生资源或3.1暂停；Git后的文档提交不更改受验产品。公开UI迁移不新增权限；已有clipboard/auth/native权限责任继续原Story。Apple/微信实际接入平台或非密配置位置已单独询问，等待期间继续独立工作，不恢复已被PNVS替代的旧身份平台候选。
