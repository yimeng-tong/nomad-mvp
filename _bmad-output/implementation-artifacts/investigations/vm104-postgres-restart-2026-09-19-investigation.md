# Investigation: VM104 PostgreSQL repeated restart

## 最终结论（已确认）

Ubuntu的每日自动升级在北京时间14:33–14:37运行，多批次安装后由needrestart自动重启服务。日志中保留了7条明确包含PostgreSQL的systemctl restart命令，升级包包含postgresql-16及共享系统库；Nomad/Nginx/Redis也在部分重启名单中。用户未操作服务，与自动维护机制一致。

升级已结束，PostgreSQL当前为16.15；14:46核查时四个服务均active，既有/api/health返回status ok，PG启动时间已持续约9.5分钟未变。没有修改系统安全升级策略；后续探针增加维护状态检查。Story1.7的SSE完整矩阵随后通过，继续客户端恢复开发。

## Hand-off Brief

1. **What happened.** Confirmed: the scheduled unattended upgrade invoked needrestart repeatedly, restarting PostgreSQL and other shared services during06:34–06:36 UTC.
2. **Where the case stands.** Concluded with high confidence. Upgrade completed06:37:44 UTC; PG/Nomad/Nginx/Redis and the existing health endpoint were healthy at06:46. PostgreSQL upgraded from the prior16.14 baseline to16.15.
3. **What's needed next.** Continue Story1.7 validation after maintenance, retaining failed runs as failures. The local probe runner now checks maintenance state; shared security-update configuration was not changed.

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-09-19 |
| Status | Concluded |
| System | VM104 nomad-staging, 192.168.31.104, PostgreSQL 16-main |
| Evidence sources | systemd journal, PG startup time and filtered connection logs, local probe source, user statement |

## Problem Statement

User: “没有维护，如确实产生了重启，需要排查”. During Story1.7 SSE validation, P1017 connection closure and an idle-heartbeat assertion failure were observed. Root-cause attribution is not assumed from those test failures.

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| postgresql@16-main journal | Available | Multiple orderly stop/start records 06:34:07–06:36:32 UTC |
| systemctl show | Available | Restart=no, NRestarts=0, active/running, standard unit path |
| pg_postmaster_start_time | Available | 06:36:30.790811 UTC observed at 06:37:42.643855 UTC |
| PostgreSQL filtered FATAL log | Available | Existing nomad_staging and isolated DB both terminated at 06:35:39 |
| sudo direct service-command filter | Partial | No matching direct systemctl/pg_ctlcluster/service command returned |
| Scheduling unit/cron inventory | Available | Delegated configuration-chain.json with exact source/line references |
| Initiating control command | Available | Seven direct systemctl restart commands in unattended-upgrades dpkg output |
| Local probe source | Available | No systemctl/pg_ctlcluster restart; SQL interruption is restricted to named isolated database |

## Investigation Backlog

| # | Path to Explore | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Preserve unit/PG timeline | High | Done | Keep filtered logs, avoid SQL payload/credentials |
| 2 | Timer/cron/unit relationships | High | Done | Independent read-only inventory |
| 3 | Local/remote probe and process lifetime | High | Done | Consider orphaned probe processes and transport timeout |
| 4 | Control/auth/package-maintenance logs | High | Done | Direct package-hook restart commands captured |
| 5 | Live stability verification | Medium | Done | Live health and unchanged startup timestamp observed after maintenance |

## Timeline of Events

| Time (UTC) | Event | Source | Confidence |
| --- | --- | --- | --- |
| 06:34:07, 06:34:27, 06:34:41, 06:34:56 | Repeated stop/start | postgresql@16-main journal | Confirmed |
| 06:35:29, 06:35:39, 06:35:48 | Repeated stop/start | same journal | Confirmed |
| 06:35:39 | Both existing staging and test DB sessions terminated | PG filtered FATAL log | Confirmed |
| 06:36:30–06:36:32 | Latest observed cluster start | journal + pg_postmaster_start_time | Confirmed |

## Confirmed Findings

### Finding 1: These are cluster service restarts, not only test-DB sessions closing

**Evidence:** postgresql@16-main journal stop/start at the timestamps above; pg_postmaster_start_time changed to 06:36:30.790811 UTC. Existing nomad_staging sessions also receive administrator-termination FATAL messages.

### Finding 2: Unit automatic Restart policy is disabled

**Evidence:** systemctl show postgresql@16-main: Restart=no, NRestarts=0, StopWhenUnneeded=no.

## Deduced Conclusions

### Deduction 1: Orderly external lifecycle requests are a stronger lead than process crash/restart policy

The unit records successful deactivation followed by starts and has no automatic restart count. This does not yet identify the initiating user, script or timer.

## Hypothesized Paths

### Hypothesis 1: Maintenance or a scheduling/controller source requested cluster restarts

**Status:** Open

**Would confirm:** matching timer/script/control log with restart command and timestamps.

**Would refute:** complete controller/audit evidence shows another cause.

### Hypothesis 2: The scoped test-DB interruption indirectly triggered a shared-service watchdog

**Status:** Open

**Would confirm:** a watchdog observes the isolated DB/session condition and invokes cluster restart.

**Would refute:** no such dependency and an independent restart initiator is identified.

### Hypothesis 3: An orphaned test or another local task issued unrelated restart commands

**Status:** Open

**Would confirm:** live process/script or task logs contain matching control operations.

**Would refute:** process/command provenance rules this out.

### Hypothesis 4: PostgreSQL crashed and systemd automatically restarted it

**Status:** Refuted for the observed unit policy path

**Resolution:** orderly stop/start, Restart=no and NRestarts=0 contradict automatic Restart recovery. A different external crash monitor is still covered by Hypothesis1/2.

## Missing Evidence

| Gap | Impact | How to Obtain |
| --- | --- | --- |
| Additional package-setup stop/start | Seven needrestart commands vs eight unit restarts; exact eighth maintainer call not separately traced | Package maintainer trace only if exact per-stop attribution becomes necessary |
| Long-term maintenance policy | Outside this diagnosis | Separate user decision if scheduling is to change |

## Source Code Trace

| Element | Detail |
| --- | --- |
| Local test transport | ops/pve-staging/run-auth-persistence-probe.py |
| Scoped interruption | apps/server/scripts/auth-ingest-sse-probe.ts; ALTER only guarded nomad_auth_test database and terminate_backend filtered by datname |
| Shared cluster restart commands | No match in current ops/scripts/.github search other than bootstrap enable/start |

## Initial Conclusion (historical)

**Confidence:** High for observed restart, Low for attribution at this initial point.

Restarts are confirmed. Do not attribute them to the user, the SSE implementation or the isolated SQL probe without an initiating source.

## Recommended Next Steps

Continue read-only provenance collection, then document a bounded correction if a cause is established. No service restarts, database deletion, credential collection or production deployment are authorized by this case file.

## Reproduction Plan

Do not intentionally reproduce cluster-wide restarts while existing staging shares the service. Validate a confirmed trigger in isolation where possible.

## Side Findings

The SSE remote runner has an inner 180s timeout but the outer SSH subprocess remains 90s. That can abandon remote probe work and must be corrected before further long probes; it does not itself prove a PostgreSQL service restart cause.


## Follow-up: 2026-09-19 — root cause confirmed

### New Evidence

- `evidence/vm104-postgres-restart-2026-09-19/configuration-chain.json` records the read-only unit/cron/hook inventory with original file/line references.
- `/var/log/unattended-upgrades/unattended-upgrades.log:14` starts the upgrade at06:33:19 UTC; line18 lists PostgreSQL16, libpq, libc, OpenSSL/systemd and other packages; line20 records all upgrades installed at06:37:27.
- `evidence/vm104-postgres-restart-2026-09-19/upgrade-and-restart.json` preserves seven dpkg blocks explicitly executing `systemctl restart ... postgresql@16-main.service ...`; those lists also include Nomad Server, Nginx and Redis. Original LF-based line numbers and block start/end times are retained. PostgreSQL's own package is upgraded in the same window.
- `apt-daily-upgrade.timer` triggered06:33:18 UTC; its service completed successfully06:37:44. The daily06:00+up-to60-minute random delay explains the14:33 Beijing-time start without user action.
- `health-after-upgrade.txt`: at06:46:02 UTC, the upgrade service was inactive, PG/Nomad/Nginx/Redis were active and existing `/api/health` returnedstatus ok. PG's start time remained06:36:30, so no further PG restart occurred in the observed9.5-minute interval.

### Confirmed Cause

**Confidence: High.** The scheduled unattended upgrade repeatedly runs the DPkg Post-Invoke needrestart hook. Ubuntu's `-m u` mode selects automatic restart in the observed configuration. The direct dpkg restart commands match the service-stop window and include PostgreSQL and the existing application services. This is scheduled system maintenance, not user maintenance or the PG unit's crash-restart policy.

Seven direct needrestart PG restart commands are preserved; the unit journal contains eight restarts. PostgreSQL package setup is also in that window. The exact individual package-maintainer call for the additional stop/start was not separately traced; that does not change the confirmed unattended-upgrade cause of the repeated restart incident.

### Updated Hypotheses

1. **Confirmed:** scheduled upgrade/needrestart requested shared-service restarts; direct commands and matching unit timeline establish the chain.
2. **Refuted for the observed incident:** the isolated test DB interruption as a shared watchdog trigger. The independently scheduled upgrade and direct package-hook commands account for the restart window; no such watchdog was found in the inspected sources.
3. **Refuted for the observed incident:** an unrelated task issuing the recorded cluster restarts. The direct commands are in unattended-upgrades' dpkg output. The test runner contains no cluster restart call.
4. **Refuted:** PG-unit automatic crash recovery; unit policy and orderly journal remain contrary evidence.

### Backlog Changes

The provenance and current-health items are Done. No system update/restart policy was changed. Root cause investigation is concluded; security-update scheduling changes require a separate user decision and are not part of this diagnosis.

The authorized Story1.7 probe runner now checks the maintenance unit's ActiveState (including activating/deactivating) before starting, and its outer SSH deadline covers the180s SSE probe instead of expiring at90s. These local runner changes prevent overlap/abandoned observations; they do not disable security updates or restart shared services.

### Updated Conclusion

The maintenance interruption accounts for matching-window database connection loss; it must not be used to dismiss every failed assertion. A later idle test failed before its heartbeat measurement after the probe intentionally disconnected the test DB; the probe then added readiness checks for both API instances and their event-reader pools. That readiness diagnosis is deduced from the failing phase and the passing controlled rerun, not from a captured HTTP status. Failed runs remain failures. The current complete SSE matrix now passes after maintenance; the intentional isolated-DB fault remains a separate tested scenario.


Upgrade verification also records current `serverVersion: 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)` in upgrade-and-restart.json. Earlier Story reports for16.14 remain historical; current-runtime regression must use16.15.
