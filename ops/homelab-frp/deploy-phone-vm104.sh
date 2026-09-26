#!/usr/bin/env bash
# An isolated real-auth staging backend for the phone HTTPS domain.
set -euo pipefail
umask 027

archive_path="${1:?archive path is required}"
release_id="${2:?full Git commit is required}"
expected_sha256="${3:?archive SHA256 is required}"
[[ $(hostname) == nomad-staging ]] || exit 64
[[ $release_id =~ ^[0-9a-f]{40}$ && $expected_sha256 =~ ^[0-9a-f]{64}$ ]] || exit 64
phone_root=/opt/nomad-mvp/phone
release_dir="${phone_root}/releases/${release_id}"
runtime_env=/etc/nomad-mvp/phone/runtime.env
provider_env=/etc/nomad-mvp/development/providers.env
[[ -r $runtime_env && -r $provider_env ]] || exit 65
[[ ! -e $release_dir ]] || { echo 'release exists; inspect before retrying' >&2; exit 65; }
printf '%s  %s\n' "$expected_sha256" "$archive_path" | sha256sum --check -

node --env-file="$runtime_env" --env-file="$provider_env" --input-type=module <<'NODE'
const db = new URL(process.env.DATABASE_URL || '');
if (db.hostname !== '127.0.0.1' || db.pathname !== '/nomad_phone'
  || process.env.AUTH_RUNTIME_MODE !== 'staging'
  || process.env.AUTH_TEST_ADAPTER_ENABLED !== 'false'
  || process.env.AUTH_PROVIDER !== 'aliyun-pnvs'
  || process.env.AUTH_NATIVE_ENABLED !== 'true'
  || process.env.AUTH_COOKIE_SECURE !== 'true'
  || process.env.AUTH_API_ORIGIN !== 'https://nomad-test.yinianyunqi.top'
  || process.env.AUTH_PUBLIC_ORIGIN !== 'https://nomad-test.yinianyunqi.top'
  || process.env.AUTH_TRUSTED_ORIGINS !== 'https://nomad-test.yinianyunqi.top'
  || process.env.AUTH_TRUSTED_PROXY_CIDRS !== '127.0.0.1/32'
  || process.env.NOMAD_API_BIND_HOST !== '127.0.0.1'
  || process.env.INGEST_WORKER_MODE !== 'disabled'
  || process.env.INGEST_RECOVERY_ISOLATED !== 'true'
  || process.env.PORT !== '43105') {
  throw new Error('Phone runtime scope does not match isolated gateway');
}
NODE

sudo -n install -d -o nomad -g nomad -m 0750 "$phone_root" "$phone_root/releases" "$release_dir"
tar -xzf "$archive_path" -C "$release_dir"
cd "$release_dir"
CI=true pnpm install --frozen-lockfile --filter nomad-server --filter nomad-prisma --filter nomad-types
pnpm -F nomad-types run generate
pnpm -F nomad-prisma run generate
pnpm -F nomad-server run build
node --env-file="$runtime_env" --input-type=module <<'NODE'
import { spawnSync } from 'node:child_process';
const result = spawnSync('pnpm', ['-F', 'nomad-prisma', 'exec', 'prisma', 'migrate', 'deploy'],
  { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
NODE

old_target=$(readlink -f "$phone_root/current" 2>/dev/null || true)
sudo -n ln -sfn "$release_dir" "$phone_root/next"
sudo -n mv -Tf "$phone_root/next" "$phone_root/current"
sudo -n install -o root -g root -m 0644 \
  "$release_dir/ops/homelab-frp/nomad-phone.service" /etc/systemd/system/nomad-phone.service
sudo -n systemctl daemon-reload
sudo -n systemctl enable nomad-phone.service
rollback_service() {
  if [[ -n $old_target ]]; then
    sudo -n ln -sfn "$old_target" "$phone_root/next"
    sudo -n mv -Tf "$phone_root/next" "$phone_root/current"
    sudo -n systemctl restart nomad-phone.service
  else
    sudo -n systemctl stop nomad-phone.service
  fi
}
if ! sudo -n systemctl restart nomad-phone.service; then
  rollback_service
  echo 'phone API start failed; release preserved for diagnosis' >&2
  exit 1
fi
for attempt in $(seq 1 20); do
  if curl --silent --fail --max-time 2 http://127.0.0.1:43105/health >/dev/null; then
    echo "phone_release=${release_id}"
    echo 'phone_api=127.0.0.1:43105'
    echo 'existing_staging_and_development_releases=unchanged'
    exit 0
  fi
  sleep 1
done
rollback_service
echo 'phone API unhealthy; release preserved for diagnosis' >&2
exit 1
