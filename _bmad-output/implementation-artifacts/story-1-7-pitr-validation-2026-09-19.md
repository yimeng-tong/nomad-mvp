# Story1.7 隔离 PITR 验证

本轮有实质进展：补齐可复用归档/物理备份脚本和真实指定时点恢复反例。不是等待进程，也不是把生产门槛标为已完成。Story1.7仍in-progress，不进入1.8。

## 已核验

- VM104共享PostgreSQL前后均为16.15、archive_mode=off，启动时间保持2026-09-19 06:36:30UTC。存在禁用的pg_basebackup@.timer模板，未见对应实例；dpkg-db-backup.timer是包管理数据库备份，不能当PostgreSQL备份。此名称清单不排除其他外部/cron备份。
- 两个新建、postgres所有、mode0700、仅私有Unix socket的PG实例执行实际pg_basebackup/pg_verifybackup/WAL归档/recovery_target_time。目标时间后暂停恢复，owner/job/command/checkpoint/seq/event摘要匹配目标状态；晚于目标的提交没有进入恢复库，源端后续提交保持。
- 6项实际PG检查通过：错误源集群ID拒绝；备份中途读取失败后partial保留且无verified marker；物理备份/manifest校验；base之后实际归档；时间点恢复；源端不变。最终privateClustersStopped=true，源/恢复/归档/base/失败partial与日志全部保留。
- 7项本地测试是5项文件系统归档反例和2项命令边界身份测试，不计为7项真实PG验证。三层审阅修补--no-clean和备份自身pg_control标识核验后复核关闭。
- 每日备份service/timer模板已准备，systemd-analyze verify和calendar通过。没有安装、启用或假称已经每日执行。

精确记录：`evidence/story-1-7-pitr-2026-09-19/pitr.json`。两个共享实例快照、测试输出和日历结果在同目录；脚本指纹随报告封存。私有演练目录为`/tmp/nomad-ingest-pitr-nyeztgrm`。

## 设计与范围

物理base加连续WAL可用于指定时点恢复；逻辑pg_dump不是该WAL恢复链的base。归档返回成功前确保内容持久，已有同内容可以重放，内容冲突不得覆盖。依据[PostgreSQL16连续归档文档](https://www.postgresql.org/docs/16/continuous-archiving.html)；执行脚本和部署前条件见`ops/postgres/README.md`。

本次archive_timeout配置900秒，但用显式pg_switch_wal加速验证，因此不声称观测了15分钟自动轮转或实测生产RPO。备份与源数据仍在同一VM故障域；正式异机/持久备份目标、容量/保留/归档失败监控和恢复演练计划仍需落实。没有更改共享PG归档配置或重启它。

本PITR恢复实例未启动应用worker，保持recovery pause。实际App恢复后的零dispatch/停用owner/受控resume在前一独立恢复库报告中验证；它不能自动升级为PITR恢复实例完整应用验收。最新删除抑制和生产打开前校验仍需补齐。

## 预检证据修正

前轮native-preflight.json误保存了直接node执行含TS导入的加载错误；本轮使用node --import tsx重新执行并校验JSON，Android工具就绪、Xcode=null、iOS不可构建。之前已经成功的Android实际构建和双端sync证据未受此报告调用错误影响。

## 仍未完成

OPS-01生产每日全量/15分钟归档及真实RPO/指定时点完整应用恢复；生产当前删除抑制；METRICS实际staging与用户版本化体验费用目标；Android/iOS实机C07与iOS构建资源。保持相应条件in-progress，不能用私有PG演练或未启用模板关闭生产门槛。
