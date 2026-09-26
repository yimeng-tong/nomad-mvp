#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && -x /usr/local/sbin/nomad-phone-cert-receive ]] || exit 64
public_key=$(cat)
[[ $public_key != *$'\n'* && $public_key != *$'\r'* ]] || exit 66
[[ $public_key =~ ^ssh-ed25519\ [A-Za-z0-9+/]+={0,2}(\ [A-Za-z0-9._@-]+)?$ ]] || exit 66
[[ -x /usr/bin/docker && -d /opt/docker/npm/data/nginx/custom ]] || exit 67

if ! id -u nomad-phone-cert >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /var/lib/nomad-phone-cert \
    --shell /bin/bash nomad-phone-cert
fi
install -d -o nomad-phone-cert -g nomad-phone-cert -m 0700 /var/lib/nomad-phone-cert/.ssh
install -d -o root -g root -m 0755 /opt/docker/npm/data/nginx/custom/nomad
install -d -o nomad-phone-cert -g nomad-phone-cert -m 0700 /opt/docker/npm/data/nginx/custom/nomad/tls
install -d -o nomad-phone-cert -g nomad-phone-cert -m 0700 /opt/docker/npm/data/nginx/custom/nomad/tls/releases
cat >/etc/sudoers.d/nomad-phone-cert-deploy <<'EOF'
nomad-phone-cert ALL=(root) NOPASSWD: /usr/bin/docker exec npm nginx -t, /usr/bin/docker exec npm nginx -s reload
EOF
chmod 0440 /etc/sudoers.d/nomad-phone-cert-deploy
visudo -cf /etc/sudoers.d/nomad-phone-cert-deploy >/dev/null

printf 'restrict,command="/usr/local/sbin/nomad-phone-cert-receive" %s\n' "$public_key" \
  >/var/lib/nomad-phone-cert/.ssh/authorized_keys
chown nomad-phone-cert:nomad-phone-cert /var/lib/nomad-phone-cert/.ssh/authorized_keys
chmod 0600 /var/lib/nomad-phone-cert/.ssh/authorized_keys
echo 'nomad-phone-certificate-receiver-installed'
