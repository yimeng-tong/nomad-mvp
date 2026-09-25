#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_PATH="${1:?archive path is required}"
RELEASE_ID="${2:?release id is required}"
EXPECTED_SHA256="${3:?archive sha256 is required}"

OPS_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="${NOMAD_DOCKER_STAGING_ROOT:-/opt/nomad-mvp-docker}"
RELEASE_DIR="${APP_ROOT}/releases/${RELEASE_ID}"
COMPOSE_ENV="${APP_ROOT}/compose.env"
SERVER_ENV="${APP_ROOT}/server.env"

printf '%s  %s\n' "${EXPECTED_SHA256}" "${ARCHIVE_PATH}" | sha256sum --check -

if [[ -e "${RELEASE_DIR}" ]]; then
  echo "release already exists: ${RELEASE_DIR}" >&2
  exit 1
fi

install -d -m 0755 "${APP_ROOT}" "${APP_ROOT}/releases" "${RELEASE_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}"

if [[ ! -f "${COMPOSE_ENV}" ]]; then
  postgres_password="$(openssl rand -hex 24)"
  {
    printf 'POSTGRES_PASSWORD=%s\n' "${postgres_password}"
    printf 'NOMAD_BIND_ADDRESS=127.0.0.1\n'
    printf 'NOMAD_WEB_PORT=18080\n'
  } > "${COMPOSE_ENV}"
  chmod 0600 "${COMPOSE_ENV}"
fi

if [[ ! -f "${SERVER_ENV}" ]]; then
  {
    printf 'NODE_ENV=staging\n'
    printf 'PORT=3000\n'
    printf 'AUTH_COOKIE_SECURE=false\n'
    printf 'AUTH_COOKIE_SAMESITE=lax\n'
    printf 'AUTH_PRIVACY_URL=/legal/privacy\n'
    printf 'AUTH_USER_AGREEMENT_URL=/legal/terms\n'
    printf 'PLANNER_DEFAULT_TIMEZONE=Asia/Shanghai\n'
    printf 'PLANNER_UNDO_SECRET=%s\n' "$(openssl rand -hex 32)"
    printf 'LOCAL_KMS_CMK_B64=%s\n' "$(openssl rand -base64 32 | tr -d '\n')"
  } > "${SERVER_ENV}"
  chmod 0600 "${SERVER_ENV}"
fi

sed -i '/^NOMAD_RELEASE_DIR=/d;/^NOMAD_ENV_FILE=/d' "${COMPOSE_ENV}"
{
  printf 'NOMAD_RELEASE_DIR=%s\n' "${RELEASE_DIR}"
  printf 'NOMAD_ENV_FILE=%s\n' "${SERVER_ENV}"
} >> "${COMPOSE_ENV}"

docker compose --env-file "${COMPOSE_ENV}" -f "${OPS_DIR}/compose.yaml" pull --ignore-buildable
docker compose --env-file "${COMPOSE_ENV}" -f "${OPS_DIR}/compose.yaml" build
docker compose --env-file "${COMPOSE_ENV}" -f "${OPS_DIR}/compose.yaml" up -d --wait

echo "release=${RELEASE_ID}"
echo "url=http://127.0.0.1:18080"
echo "deployment=complete"
