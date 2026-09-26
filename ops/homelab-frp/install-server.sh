#!/usr/bin/env bash
set -euo pipefail

# Run on the Alibaba Cloud host as root after placing the verified v0.65.0 frps
# binary at /tmp/nomad-frps-0.65.0. This creates a separate Nomad instance.
binary=/tmp/nomad-frps-0.65.0
config_dir=/etc/nomad-frp/server
ca_dir=/etc/nomad-frp/ca
installed_binary=/usr/local/libexec/nomad-frps

[[ $EUID -eq 0 ]] || { echo 'root required' >&2; exit 1; }
[[ -f $binary ]] || { echo 'verified frps binary missing' >&2; exit 1; }
if [[ -e $config_dir/frps.toml || -e /etc/systemd/system/nomad-frps.service ]]; then
  echo 'Nomad frps is already provisioned; inspect and preserve its credentials' >&2
  exit 1
fi
if [[ -e $ca_dir/ca.key && ! -e $ca_dir/ca.crt ]] ||
   [[ -e $ca_dir/ca.crt && ! -e $ca_dir/ca.key ]] ||
   [[ -e $config_dir/server.key && ! -e $config_dir/server.crt ]] ||
   [[ -e $config_dir/server.crt && ! -e $config_dir/server.key ]]; then
  echo 'partial certificate state; inspect before installing' >&2
  exit 1
fi
if ss -lnt | grep -Eq ':(7001|25245)[[:space:]]'; then
  echo 'Nomad FRP ports already occupied; inspect before installing' >&2
  exit 1
fi
ip -4 addr show docker0 | grep -q '172\.17\.0\.1/' || {
  echo 'expected Docker bridge address missing' >&2
  exit 1
}

umask 077
if ! id -u nomad-frps >/dev/null 2>&1; then
  useradd --system --home /nonexistent --shell /usr/sbin/nologin nomad-frps
fi
install -d -m 0755 /usr/local/libexec
install -o root -g root -m 0755 "$binary" "$installed_binary"
install -d -o root -g nomad-frps -m 0750 "$config_dir"
install -d -o root -g root -m 0700 "$ca_dir"

if [[ ! -f $config_dir/token ]]; then
  openssl rand -hex 48 > "$config_dir/token"
fi
chown root:nomad-frps "$config_dir/token"
chmod 0640 "$config_dir/token"

if [[ ! -f $ca_dir/ca.key ]]; then
  openssl ecparam -name prime256v1 -genkey -noout -out "$ca_dir/ca.key"
  openssl req -new -x509 -sha256 -days 1825 \
    -key "$ca_dir/ca.key" -out "$ca_dir/ca.crt" \
    -subj '/CN=Nomad FRP Development CA' \
    -addext 'basicConstraints=critical,CA:TRUE' \
    -addext 'keyUsage=critical,keyCertSign,cRLSign'
fi
chmod 0600 "$ca_dir/ca.key"
chmod 0644 "$ca_dir/ca.crt"

if [[ ! -f $config_dir/server.key || ! -f $config_dir/server.crt ]]; then
  openssl ecparam -name prime256v1 -genkey -noout -out "$config_dir/server.key"
  openssl req -new -sha256 -key "$config_dir/server.key" \
    -out "$ca_dir/server.csr" -subj '/CN=nomad-frps.yinianyunqi.top'
  cat > "$ca_dir/server.ext" <<'EOF'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectAltName=DNS:nomad-frps.yinianyunqi.top
EOF
  openssl x509 -req -sha256 -days 365 -in "$ca_dir/server.csr" \
    -CA "$ca_dir/ca.crt" -CAkey "$ca_dir/ca.key" -CAcreateserial \
    -extfile "$ca_dir/server.ext" -out "$config_dir/server.crt" >/dev/null
  rm -f "$ca_dir/server.csr" "$ca_dir/server.ext"
fi
chown root:nomad-frps "$config_dir/server.key" "$config_dir/server.crt"
chmod 0640 "$config_dir/server.key" "$config_dir/server.crt"

cat > "$config_dir/frps.toml" <<'EOF'
# Managed Nomad development FRP instance
bindAddr = "0.0.0.0"
bindPort = 7001
proxyBindAddr = "172.17.0.1"
allowPorts = [{ single = 25245 }]
maxPortsPerClient = 1
detailedErrorsToClient = false
auth.method = "token"
auth.tokenSource.type = "file"
auth.tokenSource.file.path = "/etc/nomad-frp/server/token"
transport.tls.force = true
transport.tls.certFile = "/etc/nomad-frp/server/server.crt"
transport.tls.keyFile = "/etc/nomad-frp/server/server.key"
EOF
chown root:nomad-frps "$config_dir/frps.toml"
chmod 0640 "$config_dir/frps.toml"

cat > /etc/systemd/system/nomad-frps.service <<'EOF'
[Unit]
Description=Nomad development FRP server
Wants=network-online.target docker.service
After=network-online.target docker.service

[Service]
Type=simple
User=nomad-frps
Group=nomad-frps
ExecStart=/usr/local/libexec/nomad-frps -c /etc/nomad-frp/server/frps.toml
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

runuser -u nomad-frps -- "$installed_binary" verify -c "$config_dir/frps.toml"
systemctl daemon-reload
systemctl enable --now nomad-frps.service
rm -f "$binary"
systemctl is-active --quiet nomad-frps.service
echo 'Nomad frps installed; token and CA certificate remain server-side.'
