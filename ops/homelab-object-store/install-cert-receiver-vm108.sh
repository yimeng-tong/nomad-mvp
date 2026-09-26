#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 && $(hostname) == nomad-object-store ]] || exit 64
[[ -x /usr/local/sbin/nomad-object-cert-receive ]] || exit 65
public_key=$(cat)
[[ $public_key != *$'\n'* && $public_key != *$'\r'* ]] || exit 66
[[ $public_key =~ ^ssh-ed25519\ [A-Za-z0-9+/]+={0,2}(\ [A-Za-z0-9._@-]+)?$ ]] || exit 66

id nomad-cert-deploy >/dev/null 2>&1 || useradd --system --create-home \
  --home-dir /var/lib/nomad-cert-deploy --shell /bin/bash nomad-cert-deploy
# Parent is traverse-only to unprivileged users; the certificate account is
# deliberately not in the group that can read the S3 admin configuration.
chmod 0751 /etc/nomad-object-store
case " $(id -nG nomad-cert-deploy) " in
  *' nomad-objects '*) gpasswd -d nomad-cert-deploy nomad-objects >/dev/null ;;
esac
install -d -o nomad-cert-deploy -g nomad-cert-deploy -m 0700 /var/lib/nomad-cert-deploy/.ssh
install -d -o nomad-cert-deploy -g nomad-cert-deploy -m 0700 /etc/nomad-object-store/tls
install -d -o nomad-cert-deploy -g nomad-cert-deploy -m 0700 /etc/nomad-object-store/tls/releases
cat >/etc/sudoers.d/nomad-object-cert-deploy <<'EOF'
nomad-cert-deploy ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
EOF
chmod 0440 /etc/sudoers.d/nomad-object-cert-deploy
visudo -cf /etc/sudoers.d/nomad-object-cert-deploy >/dev/null

printf 'restrict,from="192.168.31.104",command="/usr/local/sbin/nomad-object-cert-receive" %s\n' "$public_key" \
  >/var/lib/nomad-cert-deploy/.ssh/authorized_keys
chown nomad-cert-deploy:nomad-cert-deploy /var/lib/nomad-cert-deploy/.ssh/authorized_keys
chmod 0600 /var/lib/nomad-cert-deploy/.ssh/authorized_keys
ufw allow from 192.168.31.104 to any port 22 proto tcp >/dev/null
echo 'cert-receiver-installed'
