#!/usr/bin/env bash
# Isolated development API only. Never replaces the existing staging release/database.
set -euo pipefail
umask 027

ARCHIVE_PATH="${1:?archive path is required}"
RELEASE_ID="${2:?full Git commit is required}"
EXPECTED_SHA256="${3:?archive SHA256 is required}"
[[ "$(hostname)" == "nomad-staging" ]] || { echo "wrong deployment host" >&2; exit 2; }
[[ "${RELEASE_ID}" =~ ^[0-9a-f]{40}$ && "${EXPECTED_SHA256}" =~ ^[0-9a-f]{64}$ ]] || { echo "invalid release identity" >&2; exit 2; }

DEV_ROOT=/opt/nomad-mvp/development
RELEASE_DIR="${DEV_ROOT}/releases/${RELEASE_ID}"
RUNTIME_ENV=/etc/nomad-mvp/development/runtime.env
PROVIDER_ENV=/etc/nomad-mvp/development/providers.env
[[ -r "${RUNTIME_ENV}" && -r "${PROVIDER_ENV}" ]] || { echo "private development configuration is missing" >&2; exit 2; }
[[ ! -e "${RELEASE_DIR}" ]] || { echo "release already exists; inspect before retrying" >&2; exit 2; }
printf '%s  %s\n' "${EXPECTED_SHA256}" "${ARCHIVE_PATH}" | sha256sum --check -

# Validate the database target before any dependency script or migration can run.
node --env-file="${RUNTIME_ENV}" --input-type=module <<'NODE'
const db = new URL(process.env.DATABASE_URL || '');
if (db.hostname !== '127.0.0.1' || db.pathname !== '/nomad_development' ||
    process.env.AUTH_RUNTIME_MODE !== 'local' ||
    process.env.AUTH_TEST_ADAPTER_ENABLED !== 'false' ||
    process.env.INGEST_WORKER_MODE !== 'disabled' ||
    process.env.INGEST_RECOVERY_ISOLATED !== 'true' ||
    process.env.PORT !== '43104') {
  throw new Error('Development runtime scope does not match the isolated deployment');
}
NODE

sudo install -d -o nomad -g nomad -m 0750 "${DEV_ROOT}" "${DEV_ROOT}/releases" "${RELEASE_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}"
cd "${RELEASE_DIR}"

# Provider secrets are deliberately absent during install/build/type generation.
CI=true pnpm install --frozen-lockfile --filter nomad-server --filter nomad-prisma --filter nomad-types
pnpm -F nomad-types run generate
pnpm -F nomad-prisma run generate
pnpm -F nomad-server run build
node --env-file="${RUNTIME_ENV}" --input-type=module <<'NODE'
import { spawnSync } from 'node:child_process';
const result = spawnSync('pnpm', ['-F', 'nomad-prisma', 'exec', 'prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
NODE

# A failed migration/build above leaves the current development service untouched.
sudo ln -sfn "${RELEASE_DIR}" "${DEV_ROOT}/next"
sudo mv -Tf "${DEV_ROOT}/next" "${DEV_ROOT}/current"
sudo install -o root -g root -m 0644 \
  "${RELEASE_DIR}/ops/pve-staging/nomad-development.service" \
  /etc/systemd/system/nomad-development.service
sudo systemctl daemon-reload
sudo systemctl enable nomad-development.service
sudo systemctl restart nomad-development.service

for attempt in $(seq 1 20); do
  if curl --silent --fail --max-time 2 http://127.0.0.1:43104/health >/dev/null; then
    echo "development_release=${RELEASE_ID}"
    echo "development_api=127.0.0.1:43104"
    echo "existing_staging_release=unchanged"
    exit 0
  fi
  sleep 1
done
echo "development API did not become healthy; preserve release for diagnosis" >&2
exit 1
