#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-object-store ]] || exit 64
[[ -x /usr/local/sbin/nomad-object-cert-receive ]] || exit 65

id nomad-cert-deploy >/dev/null 2>&1 || useradd --system --create-home \
  --home-dir /var/lib/nomad-cert-deploy --shell /bin/bash nomad-cert-deploy
usermod -aG nomad-objects nomad-cert-deploy
install -d -o nomad-cert-deploy -g nomad-cert-deploy -m 0700 /var/lib/nomad-cert-deploy/.ssh
install -d -o nomad-cert-deploy -g nomad-cert-deploy -m 0700 /etc/nomad-object-store/tls
install -d -o nomad-cert-deploy -g nomad-cert-deploy -m 0700 /etc/nomad-object-store/tls/releases
cat >/etc/sudoers.d/nomad-object-cert-deploy <<'EOF'
nomad-cert-deploy ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
EOF
chmod 0440 /etc/sudoers.d/nomad-object-cert-deploy
visudo -cf /etc/sudoers.d/nomad-object-cert-deploy >/dev/null

public_key=$(cat)
[[ $public_key == ssh-ed25519\ * ]] || exit 66
printf 'restrict,from="192.168.31.104",command="/usr/local/sbin/nomad-object-cert-receive" %s\n' "$public_key" \
  >/var/lib/nomad-cert-deploy/.ssh/authorized_keys
chown nomad-cert-deploy:nomad-cert-deploy /var/lib/nomad-cert-deploy/.ssh/authorized_keys
chmod 0600 /var/lib/nomad-cert-deploy/.ssh/authorized_keys
ufw allow from 192.168.31.104 to any port 22 proto tcp >/dev/null
echo 'cert-receiver-installed'
