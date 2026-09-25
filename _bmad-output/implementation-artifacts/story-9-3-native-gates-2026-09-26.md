# Story9.3 原生与最低版本待验收项

当前Story保持in-progress，T9、AC6及APP-HOST-01未验收。9.3已写的宿主接线、配置和浏览器交互不替代下面的实际运行；当前任务尚未取得这些资源与结果，不表示用户没有设备或资格。

| 范围 | 已有可复用内容 | 本Story关闭前仍需实际证据 |
| --- | --- | --- |
| iOS16.4与代表性当前iPhone | Capacitor工程、App SPM最低16.4、JS/CSS目标、原native-auth和共享Portal/Sheet代码 | Mac/Xcode实编、正式应用标识/签名匹配；最低与当前设备安装后输入、中文键盘、安全区/系统栏、返回、前后台及进程重建 |
| Android10+/WebView111+及代表性当前设备 | 既有host协调器、keyboard优先、modal100/嵌套101、auth1000、页面0；9.3未增加第二native listener | 当前源码/lock/assets的实际安装与系统返回：先收键盘，再关顶层，再页面历史；关闭拒绝/busy、低内存、后台挂起、进程重建均记录 |
| 辅助技术和布局 | 三引擎键盘/aria/焦点、200%字号、reduced-motion、320px及桌面矩阵 | VoiceOver/TalkBack实际输出与操作；真实软键盘、safe-area四边单一owner、主CTA可达、字体放大和系统栏组合 |
| 身份及未知写入 | 实际DOM私有Portal与page遮蔽、迟到回调栅栏、原auth6与PG/SSE/IDB6定向回放 | 真实HTTPS/native audience上的冷暖登录/系统界面返回；恢复先核对owner/session再由原journal对账，无自动重POST或旧Portal复活 |
| 权限 | 9.3只改呈现、Portal、焦点和关闭策略；未新增相机/照片/定位/通知权限或原生请求接口 | 主动剪贴板属于1.6现有消费，native网络/安全存储属于1.0/9.1；其拒绝/撤回与身份恢复仍按原Story实际验证。未新增权限的结论不等于原责任N/A |
| 最低Web版本 | 固定canonical Chromium153.0.8010.12/Firefox155/WebKit26.6；ES5静态升级/noscript诚实提示 | Chromium/Edge111、Firefox128、真实Safari16.4与实际宿主范围分别记录；最新WebKit不是最低iOS/Safari实证，UA故障提示不是最低版本测试 |

Web visualViewport只补偿Web可视区域；Native使用原KeyboardResize.Native及contentInset=never，不另加键盘高度。共享popup消费原safe-area变量，html/root不重复加padding。此为源码设计，实际系统行为仍待上表验证。

资源沿用已提出的Mac/runner、签名/应用ID、Android/iPhone、正式协议和合法HTTPS问题，不重复索取阿里云/图形/U-App密钥。server-only配置位置见docs/ops/cross-device-development.md。当前没有新增真实供应商请求、SMS或共享业务库操作。

每条运行记录至少绑定：Git完整SHA、lock与构建assets摘要、设备型号/OS/WebView、构建/签名类型、后端环境与合法来源、具体场景和失败记录。全部适用项完成后才更新APP-HOST-01并将9.3推进review/done；9.2仍负责最终APK/TestFlight分发。
