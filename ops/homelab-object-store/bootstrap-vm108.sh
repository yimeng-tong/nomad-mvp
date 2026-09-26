#!/usr/bin/env bash
set -euo pipefail

# Run as root on the fresh VM108 only. Credentials stay on the two homelab hosts.
[[ $(id -u) == 0 && $(hostname) == nomad-object-store ]] || exit 64
[[ ! -e /etc/systemd/system/nomad-object-store.service && ! -e /etc/nomad-object-store/s3.json ]] || exit 67
findmnt -n /srv/nomad-object-store >/dev/null
[[ $(findmnt -n -o SOURCE /srv/nomad-object-store) == /dev/sdb ]] || exit 65
echo 'd327aa9fc73bfa7861fe3be4a4e9ebb7  /tmp/seaweedfs-4.47-linux_amd64.tar.gz' | md5sum --check --status
[[ -x /tmp/weed ]] || exit 66

id nomad-objects >/dev/null 2>&1 || useradd --system --home /nonexistent --shell /usr/sbin/nologin nomad-objects
install -o root -g root -m 0755 /tmp/weed /usr/local/bin/weed
install -d -o nomad-objects -g nomad-objects -m 0700 /srv/nomad-object-store
# The cert deploy identity needs traverse-only access to its TLS subtree,
# never group read access to the S3 configuration in this directory.
install -d -o root -g nomad-objects -m 0751 /etc/nomad-object-store

python3 - <<'PY'
import grp
import json
import os
import secrets
from pathlib import Path

directory = Path('/etc/nomad-object-store')
config_path = directory / 's3.json'
app_path = directory / 'app-credential.env'
if config_path.exists() != app_path.exists():
    raise SystemExit('partial credential state; inspect without overwriting')
if not config_path.exists():
    app_access = 'NM' + secrets.token_hex(10).upper()
    app_secret = secrets.token_urlsafe(48)
    admin_access = 'NA' + secrets.token_hex(10).upper()
    admin_secret = secrets.token_urlsafe(48)
    config = {'identities': [
        {'name': 'nomad-admin', 'credentials': [{'accessKey': admin_access, 'secretKey': admin_secret}],
         'actions': ['Admin', 'Read', 'List', 'Tagging', 'Write']},
        {'name': 'nomad-app', 'credentials': [{'accessKey': app_access, 'secretKey': app_secret}],
         'actions': ['Read:nomad-development', 'Write:nomad-development', 'List:nomad-development']},
    ]}
    for path, value, mode in [
        (config_path, json.dumps(config, separators=(',', ':')) + '\n', 0o640),
        (app_path, f'NOMAD_OBJECT_ACCESS_KEY_ID={app_access}\nNOMAD_OBJECT_SECRET_ACCESS_KEY={app_secret}\n'
                   'NOMAD_OBJECT_BUCKET=nomad-development\nNOMAD_OBJECT_ENDPOINT=http://192.168.31.108:8333\n', 0o600),
    ]:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
        with os.fdopen(fd, 'w') as output:
            output.write(value)
        os.chown(path, 0, grp.getgrnam('nomad-objects').gr_gid if path == config_path else 0)
PY

cat >/etc/systemd/system/nomad-object-store.service <<'EOF'
[Unit]
Description=Nomad private S3-compatible object store (SeaweedFS 4.47)
Wants=network-online.target
After=network-online.target
RequiresMountsFor=/srv/nomad-object-store

[Service]
Type=simple
User=nomad-objects
Group=nomad-objects
WorkingDirectory=/srv/nomad-object-store
ExecStart=/usr/local/bin/weed mini -dir=/srv/nomad-object-store -ip=127.0.0.1 -ip.bind=127.0.0.1 -s3.port=8334 -s3.config=/etc/nomad-object-store/s3.json -s3.iam=false -s3.autoCreateBucket=false -s3.allowDeleteBucketNotEmpty=false -s3.port.iceberg=0 -s3.port.lance=0 -bucket=nomad-development -master.telemetry=false -master.volumeSizeLimitMB=256 -volume.max=80 -admin.ui=false -webdav=false
Restart=on-failure
RestartSec=3s
LimitNOFILE=65536
MemoryMax=1500M
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/nomad-object-store

[Install]
WantedBy=multi-user.target
EOF

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx ufw qemu-guest-agent
rm -f /etc/nginx/sites-enabled/default
cat >/etc/nginx/sites-available/nomad-object-store <<'EOF'
server {
    listen 192.168.31.108:8333;
    server_name _;
    allow 192.168.31.104;
    deny all;
    client_max_body_size 32m;
    proxy_request_buffering off;
    proxy_buffering off;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_pass_request_headers on;
    location / { proxy_pass http://127.0.0.1:8334; }
}
EOF
ln -sfn /etc/nginx/sites-available/nomad-object-store /etc/nginx/sites-enabled/nomad-object-store
nginx -t
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow from 192.168.31.2 to any port 22 proto tcp >/dev/null
ufw allow from 192.168.31.104 to any port 8333 proto tcp >/dev/null
ufw --force enable >/dev/null
systemctl daemon-reload
systemctl enable --now qemu-guest-agent nomad-object-store nginx >/dev/null
systemctl restart nginx
systemctl is-active --quiet nomad-object-store
systemctl is-active --quiet nginx
echo 'nomad-object-store-bootstrap-complete'
