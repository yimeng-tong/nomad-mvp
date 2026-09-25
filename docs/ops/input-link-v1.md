# 首页外链与主动粘贴（Story 1.6，开发中）

当前已实现主动粘贴、未确认输入的内存接收，并接入已确认操作日志和原回执恢复（浏览器已验证）。真实 U-Link/U-App 归因及 Android/iOS 设备验收尚未完成。不能将这里的开发入口视为已注册的生产渠道。

## 第一方输入入口

原生宿主从实际安装包读取 appId，并把它附在已校验的 URL 事件中。输入模块消费原有 `subscribeHostUrl`，在宿主启动之前订阅，不另装第二套原生监听。

- 自定义入口：`<当前安装包appId>://input?v=1&text=<经过URL编码的文字>`。
- HTTPS 入口：`https://<已配置来源>/input?v=1&text=<经过URL编码的文字>`。
- `v=1`、`text` 必须各出现一次；可选 `expires` 为十位 Unix 秒时间戳，必须未过期。
- 可选 `channel` 为1–64位、`click_id` 为1–128位字母/数字/下划线/连字符。当前仅保留在未确认上下文，不上传、不当身份、不宣称归因已发生。
- 其他参数、重复参数、凭据、fragment、错误编码、其他入口或来源一律不作为可用输入。其他业务路由（例如登录回调）由各自消费者处理，不在首页制造分享错误。

HTTPS 来源通过构建期公开配置 `VITE_NOMAD_INPUT_LINK_ORIGINS` 指定，最多8个以逗号分隔的精确HTTPS origin。格式示例为 `https://links.example.test`；该示例不是实际已配置来源。无配置时HTTPS入口不可用；通配符、路径、凭据、HTTP或其他格式错误使整组HTTPS配置不可用。配置本身不证明 Universal/App Links 或 U-Link 平台已注册；域名及平台注册必须另行实证。

文字上限2000个JavaScript字符，编码后的入口URL上限32768字符，以覆盖中文百分号编码。原有外部网页打开接口仍维持8192字符边界。入站URL不是认证、授权或自动启动任务的凭据。

## 当前生命周期

1. 最多8条待确认内容、8个处理中摘要；同一身份代次中的相同摘要工作合并，完成/失败都会释放名额。内存重复指纹最多128条；内容最长保留24小时，并尊重更早的链接到期时间。
2. 登录前只保留待确认上下文；登录后必须点“放入输入框”，再由用户确认发送。首页以同一个 Dock 展示入口，不自动解析、发送或扫描剪贴板。
3. 已归属账号的待确认输入在账号变化时清除；异步摘要跨过任意账号变化也不能重新入队。账号A的失效摘要不会压掉账号B后来独立到达的输入。
4. 无效、过期、容量不足或能力缺失时保留手动输入。未确认内存内容不宣称已保存；确认后的重启恢复由独立操作日志与服务端回执共同承接。

确认动作发出前先持久保存账号绑定的操作身份；重启后先读服务端原回执，未受理或未知结果只在用户明确继续时重发原operation。详见`input-operation-journal.md`；原文不进入日志/遥测。

## 主动粘贴

使用固定版本 `@capacitor/clipboard@8.0.1`；[官方 v8 API](https://capacitorjs.com/docs/apis/clipboard) 的 `read()` 返回类型与值。已检查安装包源码：双端文字均返回 `text/plain`；原生图片不会送入composer。插件要求Capacitor8，Android工程使用compileSdk36、产品minSdk29；插件SPM最低iOS15，产品仍保持iOS16。

Web直接在点击处理内读取 Clipboard API；可用时检查用户激活。原生读取也只从“粘贴”动作触发。成功后追加到现有输入，仍需确认发送；拒绝/不可用/非文字/超长均保留长按粘贴和手动输入。异步读取期间若草稿修改或认证活动变化，旧返回值不能覆盖新内容。没有复制官方示例中的原文日志。

当前证据包括单元/界面反例、Chromium明确Clipboard替身、双端插件注册和Android编译；这些不证明iOS编译或双端系统粘贴权限已实测。


## 自定义scheme兼容性实证

实际Chrome127暴露了旧Chromium把非特殊scheme当opaque path、URL.hostname为空的差异，Node/jsdom没有复现。输入v1现在对`<appId>://input`采用严格固定入口词法解析，再以标准HTTPS URL解析query；scheme、权限来源、userinfo、路径、fragment及参数约束保持，不升级产品最低WebView。[Chromium官方变更说明](https://groups.google.com/a/chromium.org/g/blink-dev/c/svzicLXbKjw/m/aKt9fw7tBgAJ)解释了这一行为变更。浏览器合成投递已通过；OS真实投递仍单列。
