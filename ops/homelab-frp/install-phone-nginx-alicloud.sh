#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 ]] || exit 64
site_source="${1:?reviewed site config path required}"
custom=/opt/docker/npm/data/nginx/custom
site="$custom/nomad/site.conf"
http="$custom/http.conf"
include_line='include /data/nginx/custom/nomad/site.conf;'
[[ -f $site_source && -f $http && -f $custom/nomad/tls/current/fullchain.pem
   && -f $custom/nomad/tls/current/key.pem ]] || exit 65
[[ ! -e $site ]] || { echo 'Nomad site exists; inspect before installing' >&2; exit 65; }
if grep -R -l 'nomad-test\.yinianyunqi\.top' /opt/docker/npm/data/nginx/proxy_host \
    /opt/docker/npm/data/nginx/redirection_host /opt/docker/npm/data/nginx/dead_host 2>/dev/null | grep -q .; then
  echo 'NPM already owns Nomad hostname' >&2
  exit 65
fi
if grep -Fxq "$include_line" "$http"; then
  echo 'Nomad custom include already exists' >&2
  exit 65
fi
curl --fail --silent --show-error --max-time 8 http://172.17.0.1:25245/health >/dev/null

backup="$custom/http.conf.nomad-before-$(date -u +%Y%m%d%H%M%S)"
cp -p "$http" "$backup"
install -o root -g root -m 0644 "$site_source" "$site"
printf '\n%s\n' "$include_line" >> "$http"
if ! docker exec npm nginx -t >/dev/null 2>&1 || ! docker exec npm nginx -s reload >/dev/null 2>&1; then
  cp -p "$backup" "$http"
  docker exec npm nginx -t >/dev/null 2>&1
  docker exec npm nginx -s reload >/dev/null 2>&1
  echo 'Nomad Nginx test/reload failed; former NPM configuration restored' >&2
  exit 1
fi
echo 'Nomad phone HTTPS virtual host installed; existing NPM proxy hosts preserved'
