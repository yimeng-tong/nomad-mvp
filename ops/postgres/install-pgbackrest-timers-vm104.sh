#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-staging ]] || exit 64
[[ -r /etc/pgbackrest/nomad-main.conf ]] || exit 65
[[ $(sudo -u postgres psql -XqAt -c 'SHOW archive_mode') == on ]] || exit 66

cat >/etc/systemd/system/nomad-pgbackrest-full.service <<'EOF'
[Unit]
Description=Nomad main PostgreSQL encrypted full backup to private S3 bucket
Requires=postgresql@16-main.service
After=postgresql@16-main.service network-online.target

[Service]
Type=oneshot
User=postgres
Group=postgres
UMask=0077
ExecStart=/usr/bin/pgbackrest --config=/etc/pgbackrest/nomad-main.conf --stanza=nomad-main --type=full backup
TimeoutStartSec=30min
EOF

cat >/etc/systemd/system/nomad-pgbackrest-full.timer <<'EOF'
[Unit]
Description=Daily Nomad PostgreSQL full backup

[Timer]
OnCalendar=*-*-* 03:15:00 UTC
RandomizedDelaySec=5min
Persistent=true
Unit=nomad-pgbackrest-full.service

[Install]
WantedBy=timers.target
EOF

cat >/etc/systemd/system/nomad-pgbackrest-check.service <<'EOF'
[Unit]
Description=Nomad PostgreSQL WAL archive and repository check
Requires=postgresql@16-main.service
After=postgresql@16-main.service network-online.target

[Service]
Type=oneshot
User=postgres
Group=postgres
UMask=0077
ExecStart=/usr/bin/pgbackrest --config=/etc/pgbackrest/nomad-main.conf --stanza=nomad-main check
TimeoutStartSec=5min
EOF

cat >/etc/systemd/system/nomad-pgbackrest-check.timer <<'EOF'
[Unit]
Description=Periodic Nomad PostgreSQL WAL archive check

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
RandomizedDelaySec=1min
Unit=nomad-pgbackrest-check.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl start nomad-pgbackrest-check.service
systemctl start nomad-pgbackrest-full.service
systemctl enable --now nomad-pgbackrest-check.timer nomad-pgbackrest-full.timer >/dev/null
systemctl is-active --quiet nomad-pgbackrest-check.timer
systemctl is-active --quiet nomad-pgbackrest-full.timer
echo 'pgbackrest-check-and-full-backup-timers-enabled'
