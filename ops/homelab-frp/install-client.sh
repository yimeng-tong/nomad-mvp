#!/usr/bin/env bash
set -euo pipefail

# Run on VM104 with sudo after placing the verified v0.65.0 frpc binary at
# /tmp/nomad-frpc-0.65.0. Transfer token and public CA before activation.
binary=/tmp/nomad-frpc-0.65.0
config_dir=/etc/nomad-frp
installed_binary=/usr/local/libexec/nomad-frpc

[[ $EUID -eq 0 ]] || { echo 'root required' >&2; exit 1; }
[[ -f $binary ]] || { echo 'verified frpc binary missing' >&2; exit 1; }
if [[ -e $config_dir/frpc.toml || -e /etc/systemd/system/nomad-frpc.service ]]; then
  echo 'Nomad frpc is already provisioned; inspect and preserve its credentials' >&2
  exit 1
fi
curl --fail --silent --show-error http://127.0.0.1:43104/health >/dev/null
umask 077
if ! id -u nomad-frpc >/dev/null 2>&1; then
  useradd --system --home /nonexistent --shell /usr/sbin/nologin nomad-frpc
fi
install -d -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$binary" "$installed_binary"
install -d -o root -g nomad-frpc -m 0750 "$config_dir"

cat > "$config_dir/frpc.toml" <<'EOF'
# Managed Nomad development FRP client
serverAddr = "47.101.189.96"
serverPort = 7001
loginFailExit = false
auth.method = "token"
auth.tokenSource.type = "file"
auth.tokenSource.file.path = "/etc/nomad-frp/client_token"
transport.tls.enable = true
transport.tls.trustedCaFile = "/etc/nomad-frp/ca.crt"
transport.tls.serverName = "nomad-frps.yinianyunqi.top"

[[proxies]]
name = "nomad-development-api"
type = "tcp"
localIP = "127.0.0.1"
localPort = 43104
remotePort = 25245
EOF
chown root:nomad-frpc "$config_dir/frpc.toml"
chmod 0640 "$config_dir/frpc.toml"

cat > /etc/systemd/system/nomad-frpc.service <<'EOF'
[Unit]
Description=Nomad development FRP client
Wants=network-online.target nomad-development.service
After=network-online.target nomad-development.service

[Service]
Type=simple
User=nomad-frpc
Group=nomad-frpc
ExecStart=/usr/local/libexec/nomad-frpc -c /etc/nomad-frp/frpc.toml
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
LockPersonality=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
rm -f "$binary"
echo 'Nomad frpc prepared; transfer token and public CA, then verify and enable.'
