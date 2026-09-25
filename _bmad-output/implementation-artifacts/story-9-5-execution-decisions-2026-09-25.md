# Story9.5实施决定

## D1 实际执行基线与T0

CS/两项独立VS已完成，准备提交fcffc1157837a39c7c563288fcb1cafa9d4f5383已push，当前唯一writer与WSL/Git协作不变。保留Story原a950ea0代码基线，development-baseline.json记录实际DS起点。两个条件仅in-progress，3.1和真实资源门槛保留。

T0先在批准固定MCR Noble/amd64镜像实际启动三引擎并采集Node/pnpm/字体/OS/hash。为此先接CI环境预检和9.5触发入口，这是T0所需配置，不宣称产品流程/截图门禁已实现。现有playwright/test可复用，不安装新增工具包。根旧CI保持，canonical运行器显式Node22.22.1/pnpm11.7.0。

## D2 Firefox容器用户一致性

实际CI日志显示Firefox拒绝以root运行在pwuser拥有的GitHub临时home；使用官方镜像已有pwuser作为container user，遵循目录既有ownership，不重设HOME或修改宿主目录。Node/pnpm仍显式固定。该设置须实际容器三引擎启动证明，不能以配置补丁当通过。
