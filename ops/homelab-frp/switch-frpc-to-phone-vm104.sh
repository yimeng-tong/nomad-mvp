#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-staging ]] || exit 64
config=/etc/nomad-frp/frpc.toml
backup=/etc/nomad-frp/frpc.toml.pre-phone
unit=/etc/systemd/system/nomad-frpc.service
unit_backup=/etc/systemd/system/nomad-frpc.service.pre-phone
[[ -f $config && -f $unit && ! -e $backup && ! -e $unit_backup ]] || exit 65
curl --fail --silent --show-error --max-time 5 http://127.0.0.1:43105/health >/dev/null
[[ $(grep -c '^localPort = 43104$' "$config") == 1 ]] || exit 65
[[ $(grep -o 'nomad-development.service' "$unit" | wc -l) == 2 ]] || exit 65

cp -p "$config" "$backup"
python3 - "$config" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
text = path.read_text()
before = 'localPort = 43104'
assert text.count(before) == 1
path.write_text(text.replace(before, 'localPort = 43105'))
PY
chown root:nomad-frpc "$config"
chmod 0640 "$config"
if ! runuser -u nomad-frpc -- /usr/local/libexec/nomad-frpc verify -c "$config" >/dev/null; then
  cp -p "$backup" "$config"
  echo 'frpc verification failed; old target restored' >&2
  exit 1
fi
cp -p "$unit" "$unit_backup"
sed -i 's/nomad-development\.service/nomad-phone.service/g' "$unit"
systemctl daemon-reload
if ! systemctl restart nomad-frpc.service || ! systemctl is-active --quiet nomad-frpc.service; then
  cp -p "$backup" "$config"
  cp -p "$unit_backup" "$unit"
  systemctl daemon-reload
  systemctl restart nomad-frpc.service
  echo 'frpc restart failed; old target restored' >&2
  exit 1
fi
echo 'Nomad frpc target changed to isolated phone API on VM104:43105'
