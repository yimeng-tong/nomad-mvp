#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-22.22.1}"
PNPM_VERSION="${PNPM_VERSION:-11.7.0}"
NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"
NODE_ROOT="/opt/node-v${NODE_VERSION}"
PNPM_ROOT="/opt/pnpm-${PNPM_VERSION}"

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  build-essential \
  ca-certificates \
  curl \
  fonts-liberation \
  fonts-noto-cjk \
  git \
  jq \
  libasound2t64 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxkbcommon0 \
  libxrandr2 \
  libxrender1 \
  libxshmfence1 \
  libxss1 \
  libxtst6 \
  nginx \
  postgresql \
  postgresql-contrib \
  qemu-guest-agent \
  redis-server \
  xdg-utils \
  xz-utils

cd /tmp
curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}"
curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
grep " ${NODE_ARCHIVE}\$" SHASUMS256.txt > "${NODE_ARCHIVE}.sha256"
sha256sum --check "${NODE_ARCHIVE}.sha256"

sudo install -d -m 0755 "${NODE_ROOT}"
sudo tar -xJf "${NODE_ARCHIVE}" -C "${NODE_ROOT}" --strip-components=1
for binary in node npm npx corepack; do
  sudo ln -sfn "${NODE_ROOT}/bin/${binary}" "/usr/local/bin/${binary}"
done

sudo "${NODE_ROOT}/bin/npm" install --global --prefix "${PNPM_ROOT}" "pnpm@${PNPM_VERSION}"
sudo ln -sfn "${PNPM_ROOT}/bin/pnpm" /usr/local/bin/pnpm
sudo ln -sfn "${PNPM_ROOT}/bin/pnpx" /usr/local/bin/pnpx

sudo systemctl enable --now postgresql redis-server nginx
sudo systemctl enable qemu-guest-agent

node --version
pnpm --version
