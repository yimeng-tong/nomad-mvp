#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-staging ]] || exit 64
[[ -x /usr/local/sbin/nomad-issue-object-cert && -x /usr/local/sbin/nomad-deploy-object-cert ]] || exit 65

cat >/etc/systemd/system/nomad-object-cert-renew.service <<'EOF'
[Unit]
Description=Renew Nomad object-store certificate with AliDNS DNS-01 and deploy to VM108
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/sbin/nomad-issue-object-cert renew
ExecStartPost=/usr/local/sbin/nomad-deploy-object-cert
TimeoutStartSec=8min
EOF

cat >/etc/systemd/system/nomad-object-cert-renew.timer <<'EOF'
[Unit]
Description=Daily Nomad object-store DNS-01 certificate renewal check

[Timer]
OnCalendar=*-*-* 03:40:00
RandomizedDelaySec=30min
Persistent=true
Unit=nomad-object-cert-renew.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now nomad-object-cert-renew.timer >/dev/null
systemctl start nomad-object-cert-renew.service
systemctl is-active --quiet nomad-object-cert-renew.timer
systemctl is-failed --quiet nomad-object-cert-renew.service && exit 66
echo 'nomad-object-cert-renewal-enabled'
