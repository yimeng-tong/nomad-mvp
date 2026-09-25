---
story_id: '1.0'
date: '2026-09-17'
status: awaiting-required-resource-configuration
story_status: in-progress
blocking_task: T0
real_services_verified: false
server_bootstrap_integrated: false
---

# Story 1.0 T0：运行模式与资源预检

用户要求“继续下一条”，已承接为当前1.0的dev-story本地实施。当前在新分支
`codex/story-1-0-production-auth`，起始HEAD为`7250a8a131a370698bff53538a4405c2ddb94c1c`。
旧2.2分支保留、3.1继续暂停，既有未提交输入未被清理。

## 已完成的本地部分

- 新增 `apps/server/src/auth/runtime-config.ts`：明确local/test/staging/production、候选证明服务配置、必需手机号路径、适用社会化/OIDC回调、可信Origin、cookie、会话期限、真实验证码及显式代理范围。
- 真实部署模式拒绝fixture、测试OTP/captcha残留与不安全cookie/origin/代理配置；NODE_ENV=production不能降为测试模式。issuer原值保留，避免改变身份命名空间。
- 新增只读 `apps/server/scripts/auth-preflight.ts`，仅解析配置并输出无秘密的字段缺项/摘要；不启动服务器、SDK、数据库或调用任何供应商。
- 提供空值[配置模板](../../apps/server/.env.example)，没有改写现有.env或把真实秘密写入仓库。配置有效不代表服务已接通。
- 红绿验证：测试先因模块不存在失败；实现后通过。额外issuer尾斜杠用例先证明错误归一化，再修正并回归。

**该组件尚未接入现有服务启动或认证路由。** 现有登录、Map会话、开发头及Session secret问题尚未由本轮代码修复，不能称为生产认证已完成。

## 本地实际配置发现

仅检查项目已知配置位置和当前进程，记录名称/是否非空，不复制任何值。`apps/server/.env`存在DATABASE_URL和REDIS_URL；未发现Authing/极光、Apple/微信、腾讯验证码、友盟的对应本地配置或当前进程环境项。
这不等于用户没有外部账号：是否已有资源、供应商权益和实际配置路径仍待用户提供。未访问供应商控制台、PVE或现有数据库，也没有发送短信、购买或部署。

| 目标/能力 | 当前能确认 | 待补信息 |
| --- | --- | --- |
| 移动Web、桌面、安装PWA | 项目目标为Web/PWA；现有React/Vite Web代码可复用，未执行真实浏览器验收 | 实际公开域名/API来源、HTTPS部署方式；已启用的真实宿主 |
| 登录与短信主路径 | Authing和极光是已研究候选，配置校验区分二者；没有代选/开通真实租户 | 已有供应商、用户池/应用/短信通道的受控配置位置与本期启用方式 |
| Apple/微信 | 已有官方研究与宿主/上游资源前置记录 | 已有开发者/应用/关联资源、回调及平台范围；未提供不能写成已接通 |
| 腾讯验证码 | 已定义实际Web验证所需配置形状 | 实例、受控密钥引用、前后端一致配置及可验证服务权限 |
| U-Link/U-App归因 | 纯PWA的完整原要求仍需核验，未选用替代产品 | 实际可复用宿主/统计产品、受控配置位置与真实事件查询能力 |
| PostgreSQL/Redis | 仅确认本地配置有值；未连接或写入 | 独立合成测试目标及实际资源边界，既有数据库不可直接当测试库 |

## 只读预检复现

在WSL项目的apps/server目录执行（不把输出原始.env作为诊断材料）：

```bash
node --env-file=/home/tong123/work/nomad-mvp/apps/server/.env --import tsx scripts/auth-preflight.ts
```

当前返回`AUTH_CONFIGURATION_INVALID`和非零退出码，明确缺失运行模式、公开Origin、供应商选择、腾讯验证码应用/服务端验证字段；没有输出配置值。供应商尚未选择，因此其专属字段需选择后继续核验。

使用显式合成fixture环境运行同一工具返回`configurationValidated: true`、`realServicesVerified: false`，不把替身当生产证据。

## 校验与当前边界

- 配置专项：18项测试通过，涵盖测试通道隔离、两类候选配置、OIDC/issuer/回调、HTTPS/来源/cookie/代理、期限和秘密不出诊断。
- server TypeScript无输出检查通过；既有`test:auth`合同探针通过。该旧探针仍是开发替身基线，不证明生产登录已完成。
- 其它Story任务、OpenAPI/Prisma迁移、真实服务与浏览器验收未进行，T0整项及所有真实条件保持未完成。
- 新代码无新增依赖、无外发、无DB写入、无部署/采购。

## 需要补充的信息

请说明实际已开通的登录/短信、Apple/微信、腾讯验证码与友盟资源及本地配置文件位置；如尚未开通，明确说明即可。不要把密钥、验证码或完整账号凭据发到聊天中。

后续仍沿当前1.0授权继续，先固定T0的实际资源/证明路径，再进入T1合同与实现。按
[dev-story规则](../../.agents/skills/bmad-dev-story/SKILL.md) Step5，必需配置缺失触发
“Cannot proceed without necessary configuration files”，且当前任务未完成不能越到下一任务。
这次停在具体T0资源缺项，不把local配置测试当作整张Story完成，也不派发1.6。

最终交接检查与43项交接回归通过；保存的862份起始基线文件中仅4份当前跟踪文件变化，原业务文件/源规划/旧分支历史保留。新增的4份配置代码/测试/工具/模板与本预检报告为本轮产物。
