# Phone API domain: homelab route and acceptance

Updated 2026-09-27. This runbook describes the current **staging** phone API endpoint; it does not certify real login, provider calls, mobile installation or the complete Story 1.8. The user excluded physical-device testing from this domain/network acceptance.

## Route and isolation

| Layer | Current route |
| --- | --- |
| DNS | `nomad-test.yinianyunqi.top` A → `47.101.189.96` (AliDNS record `2103918904430516224`) |
| Public HTTPS | Alibaba Cloud NPM custom host, ports 80/443; 80 redirects to HTTPS; `/api/` proxies to `172.17.0.1:25245` |
| Dedicated FRP | Cloud `nomad-frps.service` on 7001; VM104 outbound `nomad-frpc.service`; bridge-only proxy `nomad-phone-api` on 25245 |
| Phone backend | VM104 `nomad-phone.service` binds `127.0.0.1:43105`; separate `nomad_phone` PostgreSQL database and Redis DB 5 |
| Desktop development | VM104 `nomad-development.service` stays on `127.0.0.1:43104` for SSH-tunneled local development |

The cloud custom NPM site lives at `/opt/docker/npm/data/nginx/custom/nomad/site.conf`, included by the existing `custom/http.conf`. The previous `cloud.yinianyunqi.top` host, old Docker FRPS 7000/OpenList 25244, original staging and development releases/databases were not replaced. The phone hostname's root path intentionally returns 404; clients use `https://nomad-test.yinianyunqi.top` as the origin and `/api` as the separate base path.

For a development-native configuration, `NOMAD_NATIVE_API_ORIGIN=https://nomad-test.yinianyunqi.top` and `NOMAD_NATIVE_API_BASE_PATH=/api` match the deployed gateway. Only use an App ID and signing identities actually registered for that build. These public values do not carry a secret or establish that a physical-device build was installed. Do not point a phone at `localhost:43104` or the private FRP control port.

The current WSL candidate used development identity `dev.nomad.mvp`. Mobile web build, Android/iOS Capacitor sync and `native:verify` passed with the exact origin/base path; both generated projects registered native auth and copied the same eight web assets. The generated native assets are build outputs, so rerun the commands with the same public variables when preparing a device build. `native:preflight` reported valid configuration but no local JDK21/Android SDK36 or Xcode; signing, installation and device runtime were not assessed.

## Certificate and renewal

VM104 holds the AliDNS credentials in its restricted provider file and uses DNS-01 with lego. The public Let's Encrypt certificate was issued after a staging issuance and expires `2026-12-25T17:42:01Z`. The restricted certificate deploy identity is pinned to the cloud SSH host key; the cloud forced-command receiver verifies the certificate chain, hostname, remaining validity and private/public key pair, then atomically switches NPM's cert and validates/reloads NPM. `nomad-phone-cert-renew.timer` is enabled and its renewal service succeeded after host activation. The cloud receiver cannot execute arbitrary SSH commands; malformed cert payloads were rejected. Certificate/key contents, DNS credentials and phone runtime secrets must remain server-side.

Check the systemd timer and the expiry before relying on this route after a long pause. DNS-01 does not need home inbound 80/443. The cloud HTTPS endpoint itself requires public 443 and, for redirects, 80.

## Read-only operational checks

On VM104, inspect unit health and the exact public DNS record without printing environment files:

```bash
sudo systemctl is-active nomad-phone.service nomad-frpc.service nomad-phone-cert-renew.timer
sudo /opt/nomad-mvp/tools/alidns/bin/python /usr/local/sbin/nomad-phone-dns check
curl --fail --silent --show-error http://127.0.0.1:43105/health
sudo -u nomad-frpc /usr/local/libexec/nomad-frpc verify -c /etc/nomad-frp/frpc.toml
```

On the cloud host, inspect the bridge-only listener, NPM and retained old services:

```bash
sudo systemctl is-active nomad-frps.service
sudo -u nomad-frps /usr/local/libexec/nomad-frps verify -c /etc/nomad-frp/server/frps.toml
ss -lntp | grep -E ':(7000|7001|25245)[[:space:]]'
curl --fail --silent --show-error http://172.17.0.1:25245/health
docker exec npm nginx -t
```

From a network with ordinary public DNS, `curl --fail --show-error https://nomad-test.yinianyunqi.top/api/health` should return 200 with trusted TLS. WSL in this environment uses fake-IP DNS, so a **direct external** probe can use `curl --noproxy '*' --resolve nomad-test.yinianyunqi.top:443:47.101.189.96 https://nomad-test.yinianyunqi.top/api/health`; VM104 also completed an ordinary-DNS public round trip. Do not use `-k` or substitute an HTTP private-tunnel response for TLS verification.

At acceptance: `/api/health` returned 200; HTTP redirected 301; anonymous import-record and SSE requests returned 401. A native request with the correct audience and no session returned 401, while a wrong audience, unexpected Origin or Cookie returned 403. Untrusted browser-write Origin returned 403; exact trusted CORS preflight allowed only the configured origin. These negative checks establish route and rejection behavior; there was no authenticated owner or live SSE stream because real login was unavailable. `/api/auth/config` returned `unavailable` until actual published privacy-policy and user-agreement HTTPS URLs are supplied. No real SMS or paid provider request was sent.

An initial public request immediately after NPM site load failed its TLS handshake. A deliberate NPM graceful reload yielded 19/20 immediate successes, then 50/50 successes after workers settled. The cause was not confirmed. Monitor public SNI/TLS and `/api/health` across any later NPM reload or cert switch before calling that change healthy. Preserve new failures as evidence rather than hiding them.

## Rollback and recovery

If the phone backend is unhealthy, stop `nomad-phone.service` or restore its previous `/opt/nomad-mvp/phone/current` release target and restart only that service. A binary rollback does not undo database migrations; preserve the separate `nomad_phone` database and use its explicit restore plan if data reversal is required. Do not touch the original staging/development databases.

If the public vhost is faulty, remove only the Nomad include from NPM's `custom/http.conf`, retain the preceding backup and Nomad site/cert files for diagnosis, then run `docker exec npm nginx -t` before `docker exec npm nginx -s reload`. Confirm the old OpenList host still answers independently. If the tunnel is faulty, use the `.pre-phone` TOML/unit backups on VM104 to restore the prior development target only after inspecting current state; restart `nomad-frpc.service` and verify its exact private target. Stopping the dedicated `nomad-frpc.service`/`nomad-frps.service` stops only Nomad's route. Do not remove the old Docker FRPS, credentials, original releases, database or evidence files.

Detailed source scripts are in [ops/homelab-frp](../../ops/homelab-frp/README.md); the scoped machine-readable results are in [phone-domain-acceptance.json](../../_bmad-output/implementation-artifacts/evidence/story-1-8-homelab-2026-09-27/phone-domain-acceptance.json). Story 1.8 keeps its other requirements open, including authentic login/SSE, real XHS import, legacy owner adjudication, cross-host backup/RPO and eventual device-specific host evidence.
