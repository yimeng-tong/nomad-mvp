#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-object-store ]] || exit 64
tls=/etc/nomad-object-store/tls/current
[[ -r "$tls/fullchain.pem" && -r "$tls/key.pem" ]] || exit 65
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt \
  -untrusted "$tls/issuer.pem" -verify_hostname objects.yinianyunqi.top \
  "$tls/leaf.pem" >/dev/null

config=/etc/nginx/sites-available/nomad-object-store
backup=/etc/nginx/sites-available/nomad-object-store.before-public-tls-20260926
[[ -e "$backup" ]] || cp -a "$config" "$backup"
attempt_backup=/etc/nginx/sites-available/nomad-object-store.before-current-tls-attempt
cp -a "$config" "$attempt_backup"
rollback() {
  cp -a "$attempt_backup" "$config"
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
}
trap rollback ERR
python3 - <<'PY'
from pathlib import Path
config = Path('/etc/nginx/sites-available/nomad-object-store')
text = config.read_text()
if 'listen 192.168.31.108:8333 ssl;' not in text:
    old = '    listen 192.168.31.108:8333;\n'
    assert text.count(old) == 1
    new = ('    listen 192.168.31.108:8333 ssl;\n'
           '    server_name objects.yinianyunqi.top;\n'
           '    ssl_certificate /etc/nomad-object-store/tls/current/fullchain.pem;\n'
           '    ssl_certificate_key /etc/nomad-object-store/tls/current/key.pem;\n'
           '    ssl_protocols TLSv1.2 TLSv1.3;\n'
           '    ssl_session_tickets off;\n')
    text = text.replace(old, new).replace('    server_name _;\n', '')
    config.write_text(text)
PY
nginx -t >/dev/null
systemctl reload nginx
sleep 2
curl --silent --show-error --noproxy '*' \
  --resolve objects.yinianyunqi.top:8333:192.168.31.108 \
  -o /dev/null -w '%{http_code}' \
  https://objects.yinianyunqi.top:8333/nomad-development/ | grep -qx 403

python3 - <<'PY'
from pathlib import Path
env = Path('/etc/nomad-object-store/app-credential.env')
values = env.read_text()
old = 'NOMAD_OBJECT_ENDPOINT=http://192.168.31.108:8333'
new = 'NOMAD_OBJECT_ENDPOINT=https://objects.yinianyunqi.top:8333'
assert old in values or new in values
env.write_text(values.replace(old, new))
env.chmod(0o600)
PY
trap - ERR
echo 'nomad-object-store-public-tls-enabled'
