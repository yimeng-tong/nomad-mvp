# Story9.4开发进度

唯一写入者：01a0d78a-3692-78b1-aee5-76268a743925；分支codex/story-9-4-workbench-quality，开发基线abac3df。当前in-progress。

已完成实现：17场景工作台、共享DTO/MSW、ready/lost与未知请求账本、真实lint及零豁免、覆盖与基准反例、内存缺陷转换测试、产品真实模块图与两端完整资源检查、CI接线。LoginScreen仅补显式失败处理、提示关联/发送文字和保持原语义的ref失效helper；既有auth/journal/cursor/lease不重写。

已运行：workbench typecheck；Node网络8；Chromium17；组件故障10＋前后正常控制2，退出码按预期且哨兵未泄漏；lint gate5组真实反例；产品污染4组；mobile242＋native配置5；workspace build；双端sync/verify；干净origin运行与截图；handoff及82回归。原始失败同样保留在/tmp/nomad-story-9-4-*.log和本地.workbench-results。证据摘要已开始封存于evidence/story-9-4-workbench-2026-09-25，最终source/lock/config摘要待审阅修复后封存。

新发现与处理：pnpm11需pnpm_config_store_dir（npm_config不会传递）；默认执行环境缺nspr/nss/asound及CJK，已仅在/tmp解压Ubuntu包并通过LD_LIBRARY_PATH/FONTCONFIG_FILE使用。共享Vite cache导致临时副本导入路径污染，专用工作台/反例cache已隔离；浏览器反例改为Vite内存转换，完全不改工作区源文件。初始testName筛选未命中时曾全跳过，控制用例要求非零真实通过，修正中文名称后通过。

剩余：从实际提交做干净frozen安装，执行完整相关回归并收取真实远端CI；独立三层CR/必要修复；File List、逐AC闭环、两条件ui_delivery_evidence与review/done状态。全部之前不标完成，其他Story条件保持。原生/Provider/生产恢复不由本Story关闭。

## 独立CR修补与第二次CI候选

三层审阅13项已修复复核，实际计数更新为18场景、网络9、16故障＋2控制、lint6组和资源5组。cleanup Promise/workerEpoch、scope绑定与fetch静态旁路/Accept保护、普通Node负例、输出bytes与native产物、移动宽度及JSX/Node globals均补齐。Storybook addon会覆盖默认cacheDir，增加post config hook保证实际使用独立cache；对应受控静态目录明确列入白名单，任意programmatic fetch仍不能绕过。

1dee5bd的干净clone冻结安装/全build/工作台17全部通过；最初Prisma只读cache utime失败以同版本已存在引擎路径显式引用解决，未改系统cache。首轮远端CI36115340403在反例输出ANSI计数报错，真实所选组件通过；已修复并用CI=true/FORCE_COLOR=1复验。下一收取修补commit全CI与最终证据。

第二轮CI36118754564在专用tsc处报告scene可能undefined；旧本地分项命令曾继续运行后续lint而隐藏该退出码。已改为先捕获scene并显式return失败，使用实际ci:workbench串联入口完整通过（9 Node＋18 Chromium），不再把后续成功覆盖编译失败。此前两轮CI原结论均保留，第三提交等待远端全量链。

第三轮CI36119579229通过所有9.4新增检查与真实native资源检查，随后原bounded_process测试的exists/read竞态在Ubuntu24.04触发ProcessLookupError。只修测试观察：消失视为已退出，活进程和PermissionError仍失败，正确解析括号comm字段；生产helper未改。4项本地测试和独立Edge复核通过。下一提交重新跑保留的完整旧链，不将该失败吞掉或跳过。

## 旧PG/HTTP探针兼容修补

第四轮CI36120947834通过9.4新门禁及修正后的进程测试，随后旧auth-persistence合成done Job缺少保存结果，被1.7现有不变量正确拒绝。本轮先新增该拒绝反例，再创建同owner/job/sourceHash的Inspiration并核对原结果ID；生产鉴权/日志/租约不改。CI三探针改在apps/server执行，与它们的子进程./src导入一致。

为验证剩余旧链，使用/tmp内新建PG18.6/UTC数据库，schema迁移、auth-persistence、auth-http、ingest-authority均实际通过。HTTP旧探针假定一次read是一个完整SSE事件，本轮改为有界首个data帧读取，保留尾部与解码器、exact owner及撤权后禁止内容断言；3个分片/合并/关闭与上限测试通过。首次进入typed lint的HTTP probe仅把原any JSON边界替换为生成DTO、明确Fastify类型，全部原断言保留。验收层/Edge分别只读复核无剩余发现。独立PG与开发工作台进程已停止，数据/失败记录保留；现有homelab和CI PG15没有改动。

新证据isolated-pg-ci-probes.json；下一取最终CI整链结论。新增实现文件清单包含两个auth probe、sse-probe-reader及其test、CI working-directory变更。

第五轮CI36123932104在新覆盖服务器probe的typed lint阶段发现Prisma client尚未生成；原生成在后续build/prebuild。已把纯类型生成提前，不连DB也不放宽规则；干净副本移开生成物后门禁67项失败，生成后0问题通过。补跑旧home/library、planner、settings三个合同探针均通过，等待第六提交远端整链。

第六轮CI36125167023已通过9.4和auth-persistence/auth-http断言，但auth-http成功后Redis连接未随Fastify关闭，进程持续等待；核对完整日志后明确取消，保留原结论。为既有Redis插件增加onClose，仅做关闭连接与类型收紧，不改key/TTL/业务权限。隔离Redis真实进程先复现“成功输出后超时”，修复后自然退出；同隔离PG加Redis的27项HTTP断言也通过且自然退出，typed lint与server build通过。临时实例已停止，数据和原失败日志保留。新增证据isolated-redis-lifecycle.json，CI加入5秒自然退出探针和整个持久认证阶段3分钟上限。

Redis追加边界复核指出QUIT可能等待无响应服务器；最终改为Fastify请求排空后本地disconnect。真实Redis正常与暂停回复10秒两组均在子进程5秒边界内自然退出，代码质量与构建再次通过。
