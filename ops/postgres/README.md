# Retained PostgreSQL backup helpers

These helpers are prepared and tested for PostgreSQL 16. They have **not** been installed as production backup jobs. The current VM104 shared cluster still has `archive_mode=off`; a disabled `pg_basebackup@.timer` template alone is not an active backup schedule.

Continuous recovery uses a physical base backup plus archived WAL. A logical pg_dump is a different artifact and cannot supply WAL replay. The archive helper follows PostgreSQL's requirement that an existing identical WAL file may succeed but a conflicting archive must not be overwritten. See [PostgreSQL 16 continuous archiving](https://www.postgresql.org/docs/16/continuous-archiving.html).

- `archive-wal.py SOURCE PRIVATE_ARCHIVE_DIRECTORY WAL_NAME`: copies into a private temporary file, fsyncs, atomically publishes without replacement, and fsyncs the directory. An existing identical archive succeeds; different contents or a symlink fail. Only this invocation's temporary file is removed. Archive directories must be owned by the cluster user and mode0700. No retention deletion is implemented.
- `base-backup.py --socket ABSOLUTE_SOCKET_DIRECTORY --backup-root PRIVATE_ROOT --expected-system-id ID`: serializes backups, verifies the live cluster identity, runs physical `pg_basebackup --no-clean`, runs `pg_verifybackup`, then checks the backup's own `pg_control` identity before publishing verified metadata beside the backup directory. Each destination is new and exclusive; incomplete directories remain without a verified marker. The PostgreSQL binaries default to `/usr/lib/postgresql/16/bin`; each subprocess has a ten-minute deadline.
- `nomad-pg-backup@.service/.timer`: uninstalled templates for a daily03:15UTC backup with up to5 minutes jitter. A root-owned `/etc/nomad/postgres-backup/INSTANCE.env` must specify `PG_SOCKET`, `PG_PORT`, and `EXPECTED_SYSTEM_ID`. The private destination is `/srv/nomad-postgres-backups/INSTANCE`, precreated mode0700 and owned by postgres. The helper must be installed at `/usr/local/lib/nomad/postgres/base-backup.py`. `PrivateTmp` means the configured socket should be the actual host socket outside `/tmp`, normally `/var/run/postgresql`. The service has Unix-socket-only access. No unit has been enabled by this change.

The archive directory must be a separately approved durable destination before production use. A local directory on the source VM only proves the mechanism and shares the same failure domain. `archive_timeout=900` bounds the age before a segment switch when working as configured, but does not establish a guaranteed15-minute RPO during archive/storage failures. The isolated test forces a switch to finish quickly; it does not simulate a full15-minute production observation. Disk capacity, archive lag/failures, job results and restore drills require monitoring and retained evidence.

Restore into a new isolated cluster. Set a chosen `recovery_target_time` and pause at the target. Keep application workers disabled until owner/disabled/deletion suppression and data invariants are verified. Preserve the source, base backup and archive. Only then consider promoting the recovered cluster under the environment's release procedure. This helper does not choose a production cutover, delete backups or invent a retention policy.

Run local archive/command-boundary tests:

```bash
python3 -m unittest discover -s ops/postgres -p 'test_*.py'
```

The repository's `ops/pve-staging/run-ingest-pitr-probe.py --execute` uses the verified synthetic active-checkpoint dump, creates two fresh postgres-owned private Unix-socket clusters on VM104, performs a physical backup/WAL target-time restore and stops only those private instances. It retains every database/archive/backup/log directory. No application worker is launched by this PITR probe; the separate `run-ingest-restore-probe.py` tests actual application isolation and controlled resume on its restored database.
