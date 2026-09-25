# WSL / macOS 开发与 homelab 后端

Updated: 2026-09-25

用户明确支持通过 Git 在 WSL 与 Mac 间同步开发。Mac可承担组件和iOS；不强制把所有开发切到Mac，也不因尚未切换暂停独立工作。Windows原生Node/pnpm继续不用于项目。iOS编译/签名必须在实际Mac/Xcode完成，WSL构建不作替代。

## Git与写入交接

仓库：git@github.com:yimeng-tong/nomad-mvp.git。当前基线分支见CURRENT.working_branch。开始9.4前先提交现有代码、规划、锁文件与脱敏证据并推送相应分支；设备端先fetch/pull，再读CURRENT→project-context→Sprint→当前Story。

同一分支不在两台设备同时改同一文件或执行依赖安装。交接前提交并push，接手端工作区干净再pull --ff-only；不同独立切片用codex/分支并明确共享文件写入者。发现本地未提交改动时保留，不reset/clean或覆盖。不能只复制组件文件而漏掉锁文件、原生工程或实际Story。

Mac可用自己的Git/SSH身份，不通过Git复制私钥。开发服务配置已集中在homelab，不需要把云Key或数据库密码复制到Mac。

## 本机工具与前端

两端保持Node22.22.1、pnpm11.7.0及仓库锁文件；WSL现有store=/tmp/nomad-sp-pnpm-store是本机缓存位置，Mac使用自身pnpm store，不提交node_modules或机器路径。

在仓库根目录：

~~~bash
pnpm install --frozen-lockfile
pnpm -F nomad-types run generate
pnpm -r build
pnpm run ci:handoff
~~~

Story9.4的Storybook/MSW与真实lint尚未实施；不能把上述build当工具已可用。实施后按该Story新增命令运行。MSW仅用于隔离工作台/测试，不冒充真实homelab或原生证明。

## 开发后端与私有配置

| 项目 | 位置/边界 |
| --- | --- |
| homelab | VM104 / nomad-staging / 192.168.31.104 |
| 已有staging服务 | /opt/nomad-mvp/current，nomad-server.service；保留旧发布和原数据库 |
| 新开发发布 | /opt/nomad-mvp/development/current；独立nomad-development.service |
| API监听 | 127.0.0.1:43104，仅通过认证SSH隧道访问；不公开DB/Redis/PVE |
| 开发数据库 | nomad_development，与原nomad_staging分开 |
| 服务端资源 | /etc/nomad-mvp/development/providers.env，root:nomad 0640 |
| 开发运行配置 | /etc/nomad-mvp/development/runtime.env，root:nomad 0640 |

providers.env承接现有Nomad PNVS/图形、AMap、已配置AI和双端U-App资源，真实secret只保存在本地忽略文件与服务器受限配置；不返回给前端、不写Git/日志。U-App应用标识的实际编译/SDK接线仍由原Story治理。Sentry/Langfuse自托管基础设施管理员配置未复制到应用服务。

新开发服务采用显式local模式、真实持久认证adapter、测试adapter关闭和独立PG；浏览器只通过本机回环HTTP进入加密SSH隧道。它不是公开生产运行配置，不能沿用local Cookie/Origin设置上线。真实法律资源尚未配置时/auth/config明确unavailable；不放假协议或stub OTP解锁真实登录。不发送真实短信、不调用AI/地图来完成部署健康检查。

INGEST_WORKER_MODE=disabled且INGEST_RECOVERY_ISOLATED=true；尚未交付的真实导入adapter不能因部署自动启用。数据库、配置和HTTP健康通过不等于真实Provider、原生、生产备份或Story完成。

## 两端调用同一后端

Mac（具有既有homelab SSH权限时）在一个终端保持隧道：

~~~bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:43104:127.0.0.1:43104 \
  -J root@192.168.31.2 nomad@192.168.31.104
~~~

WSL现有密钥在Windows OpenSSH中，使用同样转发，不复制密钥：

~~~bash
/mnt/c/Windows/System32/OpenSSH/ssh.exe -N \
  -o ExitOnForwardFailure=yes \
  -i 'C:\Users\123\.ssh\id_ed25519' \
  -L 127.0.0.1:43104:127.0.0.1:43104 \
  -J root@192.168.31.2 nomad@192.168.31.104
~~~

另开终端启动前端：

~~~bash
pnpm run dev:homelab
~~~

Mac可直接curl --fail http://localhost:43104/health。使用Windows OpenSSH建立隧道时，回环监听在Windows；本轮实际验证使用/mnt/c/Windows/System32/curl.exe --noproxy "*" --fail http://localhost:43104/health，浏览器也在Windows打开localhost。WSL自身是否共享Windows回环取决于其网络模式，不能把WSL内curl失败当远端API故障。

打开http://localhost:5173。前端只设置公开VITE_API_BASE_URL=http://localhost:43104，保留credentials/include与现有auth transport，不带云Key/DB密码。固定localhost/端口以匹配开发Origin，不用任意LAN host或改成通配符。浏览器同一localhost站点的不同端口由后端精确CORS校验；不重写Origin绕过CSRF。组件开发的合成场景仍留在独立工作台。

## frp与原生HTTPS

用户确认曾使用frp，具体主机/配置位置仍在核实。本轮VM104与105/106未发现frpc；旧计划nomad-test.yinianyunqi.top在VM104解析失败，不能当当前可用地址。收到实际入口后复用现有frp，核验TLS、精确Origin/Cookie、反代/SSE与原生API audience，再单独记录真正的HTTPS验收。

SSH隧道只供桌面开发。iPhone/Android真机不能把自己的localhost当Mac，也不放宽原生HTTPS校验。原生构建使用已核验的HTTPS后端及原有CAP_*配置；缺实际入口时C07/真实认证等对应切片保持未验收，组件工作不被整体阻塞。

## 受控开发发布

使用ops/pve-staging/deploy-development.sh部署指定干净Git提交的archive。它只写新的development release、独立开发数据库和服务，不替换旧current、不重启共享PostgreSQL、不执行真实用户迁移/清理。私有runtime/providers配置必须事先就位；部署缺项失败，不生成假资源。

单次部署检查archive SHA、迁移、server build、local健康及/auth/config，并记录源码commit、lockfile、配置存在性和实际HTTP结果。回退仅切development/current到前一开发release并重启开发服务；数据库变化仍按DB-CHANGE-01前向/恢复计划处理，不能假称切二进制回滚了schema。

## 本轮实际核验

基线b8b445567f60fcafd0ff2d8dcd75498659b8728d已提交并推送origin/codex/story-1-0-production-auth。VM104已从该提交部署独立开发服务，6个迁移只应用于新开发库；旧10f940c49e2d发布保持。/health=200、/me未认证=401；localhost:5173精确CORS可用，不可信Origin无许可。正式协议未配置时/auth/config诚实unavailable，未发送短信或测试付费Provider。Windows回环SSH隧道健康验证成功，临时探针隧道已停止；Mac和原生HTTPS未由此替代验收。

具体脱敏证据在_bmad-output/implementation-artifacts/evidence/cross-device-development-2026-09-25/。原16份运行日志留在本地及VM104的/var/lib/nomad-mvp/development-evidence/pre-ui-logs-2026-09-25.tar.gz；Git仅记录路径/校验和，保留历史报告与失败事实。
