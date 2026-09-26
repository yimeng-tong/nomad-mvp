#!/usr/bin/env bash
set -euo pipefail
umask 027

[[ $(id -u) == 0 && $(hostname) == nomad-staging ]] || exit 64
[[ ! -e /etc/nomad-mvp/phone/runtime.env ]] || {
  echo 'phone runtime exists; preserve and inspect before retrying' >&2; exit 65;
}
[[ ! -e /opt/nomad-mvp/phone/current ]] || exit 65
[[ -r /etc/nomad-mvp/development/providers.env ]] || exit 65
[[ -r /etc/nomad-mvp/development/objects.env ]] || exit 65
[[ -z $(sudo -n -u postgres psql -XAtc "SELECT 1 FROM pg_roles WHERE rolname = 'nomad_phone'" postgres) ]] || exit 65
[[ -z $(sudo -n -u postgres psql -XAtc "SELECT 1 FROM pg_database WHERE datname = 'nomad_phone'" postgres) ]] || exit 65
if ss -lnt | grep -Eq ':43105[[:space:]]'; then exit 65; fi

db_password=$(openssl rand -hex 32)
undo_secret=$(openssl rand -hex 32)
sudo -n -u postgres psql -X -v ON_ERROR_STOP=1 postgres >/dev/null <<SQL
CREATE ROLE nomad_phone LOGIN PASSWORD '${db_password}';
CREATE DATABASE nomad_phone OWNER nomad_phone;
SQL

install -d -o root -g nomad -m 0750 /etc/nomad-mvp/phone
cat >/etc/nomad-mvp/phone/runtime.env <<EOF
AUTH_RUNTIME_MODE=staging
AUTH_PROVIDER=aliyun-pnvs
AUTH_PUBLIC_ORIGIN=https://nomad-test.yinianyunqi.top
AUTH_API_ORIGIN=https://nomad-test.yinianyunqi.top
AUTH_TRUSTED_ORIGINS=https://nomad-test.yinianyunqi.top
AUTH_TRUSTED_PROXY_CIDRS=127.0.0.1/32
AUTH_LOGIN_METHODS=phone
AUTH_NATIVE_ENABLED=true
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
AUTH_CAPTCHA_MODE=risk
AUTH_TEST_ADAPTER_ENABLED=false
AUTH_SESSION_TTL_SEC=2592000
DATABASE_URL=postgresql://nomad_phone:${db_password}@127.0.0.1:5432/nomad_phone
REDIS_URL=redis://127.0.0.1:6379/5
INGEST_WORKER_MODE=disabled
INGEST_RECOVERY_ISOLATED=true
PLANNER_DEFAULT_TIMEZONE=Asia/Shanghai
PLANNER_UNDO_SECRET=${undo_secret}
NOMAD_API_BIND_HOST=127.0.0.1
PORT=43105
EOF
chown root:nomad /etc/nomad-mvp/phone/runtime.env
chmod 0640 /etc/nomad-mvp/phone/runtime.env
install -d -o nomad -g nomad -m 0750 /opt/nomad-mvp/phone /opt/nomad-mvp/phone/releases
echo 'phone runtime and new isolated database prepared; no existing database or service changed'
