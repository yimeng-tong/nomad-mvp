#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-staging ]] || exit 64
[[ -x /usr/local/sbin/nomad-issue-phone-cert && -x /usr/local/sbin/nomad-deploy-phone-cert ]] || exit 65

cat >/etc/systemd/system/nomad-phone-cert-renew.service <<'EOF'
[Unit]
Description=Renew Nomad phone API certificate via AliDNS DNS-01 and deploy to Alibaba Cloud
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/sbin/nomad-issue-phone-cert renew
ExecStartPost=/usr/local/sbin/nomad-deploy-phone-cert
TimeoutStartSec=8min
EOF

cat >/etc/systemd/system/nomad-phone-cert-renew.timer <<'EOF'
[Unit]
Description=Daily Nomad phone API certificate renewal check

[Timer]
OnCalendar=*-*-* 04:20:00
RandomizedDelaySec=30min
Persistent=true
Unit=nomad-phone-cert-renew.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now nomad-phone-cert-renew.timer >/dev/null
systemctl start nomad-phone-cert-renew.service
systemctl is-active --quiet nomad-phone-cert-renew.timer
systemctl is-failed --quiet nomad-phone-cert-renew.service && exit 66
echo 'nomad-phone-certificate-renewal-enabled'
