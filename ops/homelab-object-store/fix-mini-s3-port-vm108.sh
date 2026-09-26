#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-object-store ]] || exit 64
unit=/etc/systemd/system/nomad-object-store.service
config=/etc/nginx/sites-available/nomad-object-store
unit_backup="$unit.before-s3-port-20260926"
config_backup="$config.before-s3-port-20260926"
[[ ! -e "$unit_backup" && ! -e "$config_backup" ]] || exit 65
cp -a "$unit" "$unit_backup"
cp -a "$config" "$config_backup"
rollback() {
  systemctl stop nginx || true
  cp -a "$unit_backup" "$unit"
  cp -a "$config_backup" "$config"
  systemctl daemon-reload
  systemctl restart nomad-object-store || true
  systemctl start nginx || true
}
trap rollback ERR
systemctl stop nginx
python3 - <<'PY'
from pathlib import Path
unit = Path('/etc/systemd/system/nomad-object-store.service')
config = Path('/etc/nginx/sites-available/nomad-object-store')
service = unit.read_text()
proxy = config.read_text()
assert service.count('-s3.port=8333 ') == 1
assert proxy.count('proxy_pass http://127.0.0.1:8333;') == 1
unit.write_text(service.replace('-s3.port=8333 ', '-s3.port=8334 '))
config.write_text(proxy.replace('proxy_pass http://127.0.0.1:8333;',
                                'proxy_pass http://127.0.0.1:8334;'))
PY
systemctl daemon-reload
systemctl restart nomad-object-store
systemctl is-active --quiet nomad-object-store
nginx -t >/dev/null
systemctl start nginx
sleep 2
curl --silent --show-error --noproxy '*' \
  --resolve objects.yinianyunqi.top:8333:192.168.31.108 \
  -o /dev/null -w '%{http_code}' \
  https://objects.yinianyunqi.top:8333/nomad-development/ | grep -qx 403
systemctl restart nomad-object-store
sleep 3
systemctl is-active --quiet nomad-object-store
systemctl is-active --quiet nginx
curl --silent --show-error --noproxy '*' \
  --resolve objects.yinianyunqi.top:8333:192.168.31.108 \
  -o /dev/null -w '%{http_code}' \
  https://objects.yinianyunqi.top:8333/nomad-development/ | grep -qx 403
trap - ERR
echo 's3-internal-port-separated-and-restart-verified'
