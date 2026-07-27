#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_PATH="${1:?archive path is required}"
RELEASE_ID="${2:?release id is required}"
EXPECTED_SHA256="${3:?archive sha256 is required}"

OPS_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="/opt/nomad-mvp"
RELEASE_DIR="${APP_ROOT}/releases/${RELEASE_ID}"
ENV_DIR="/etc/nomad-mvp"
ENV_FILE="${ENV_DIR}/nomad.env"

printf '%s  %s\n' "${EXPECTED_SHA256}" "${ARCHIVE_PATH}" | sha256sum --check -

if [[ -e "${RELEASE_DIR}" ]]; then
  echo "release already exists: ${RELEASE_DIR}" >&2
  exit 1
fi

sudo install -d -o nomad -g nomad -m 0755 "${APP_ROOT}" "${APP_ROOT}/releases"
sudo install -d -o nomad -g nomad -m 0755 "${RELEASE_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}"

sudo install -d -o root -g nomad -m 0750 "${ENV_DIR}"
if [[ ! -f "${ENV_FILE}" ]]; then
  db_password="$(openssl rand -hex 24)"
  kms_key="$(openssl rand -base64 32 | tr -d '\n')"
  planner_undo_secret="$(openssl rand -hex 32)"

  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'nomad_app'" | grep -qx 1; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 \
      -c "CREATE ROLE nomad_app LOGIN PASSWORD '${db_password}'"
  fi
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'nomad_staging'" | grep -qx 1; then
    sudo -u postgres createdb --owner=nomad_app nomad_staging
  fi

  env_tmp="$(mktemp)"
  chmod 0600 "${env_tmp}"
  {
    printf 'NODE_ENV=staging\n'
    printf 'PORT=3000\n'
    printf 'DATABASE_URL=postgresql://nomad_app:%s@127.0.0.1:5432/nomad_staging?schema=public\n' "${db_password}"
    printf 'REDIS_URL=redis://127.0.0.1:6379\n'
    printf 'AUTH_COOKIE_SECURE=false\n'
    printf 'AUTH_COOKIE_SAMESITE=lax\n'
    printf 'AUTH_PRIVACY_URL=/legal/privacy\n'
    printf 'AUTH_USER_AGREEMENT_URL=/legal/terms\n'
    printf 'PLANNER_DEFAULT_TIMEZONE=Asia/Shanghai\n'
    printf 'PLANNER_UNDO_SECRET=%s\n' "${planner_undo_secret}"
    printf 'LOCAL_KMS_CMK_B64=%s\n' "${kms_key}"
  } > "${env_tmp}"
  sudo install -o root -g nomad -m 0640 "${env_tmp}" "${ENV_FILE}"
  shred -u "${env_tmp}"
fi

if ! sudo grep -Eq '^PLANNER_UNDO_SECRET=.+$' "${ENV_FILE}"; then
  planner_undo_secret="$(openssl rand -hex 32)"
  if sudo grep -q '^PLANNER_UNDO_SECRET=' "${ENV_FILE}"; then
    sudo sed -i \
      "s/^PLANNER_UNDO_SECRET=.*/PLANNER_UNDO_SECRET=${planner_undo_secret}/" \
      "${ENV_FILE}"
  else
    printf 'PLANNER_UNDO_SECRET=%s\n' "${planner_undo_secret}" \
      | sudo tee -a "${ENV_FILE}" >/dev/null
  fi
fi

cd "${RELEASE_DIR}"
CI=1 pnpm install --frozen-lockfile

set -a
source "${ENV_FILE}"
set +a

pnpm -F nomad-types run generate
pnpm -F nomad-prisma run generate
pnpm -F nomad-prisma exec prisma migrate deploy
pnpm -r build
VITE_API_BASE_URL=/api pnpm -F nomad-mobile build

sudo ln -sfn "${RELEASE_DIR}" "${APP_ROOT}/current"
install -d -m 0700 /home/nomad/.config /home/nomad/.cache
sudo install -o root -g root -m 0644 \
  "${OPS_DIR}/nomad-server.service" /etc/systemd/system/nomad-server.service
sudo install -o root -g root -m 0644 \
  "${OPS_DIR}/nginx.conf" /etc/nginx/sites-available/nomad-mvp
sudo ln -sfn /etc/nginx/sites-available/nomad-mvp /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now nomad-server
sudo systemctl restart nomad-server
sudo systemctl reload nginx

echo "release=${RELEASE_ID}"
echo "deployment=complete"
