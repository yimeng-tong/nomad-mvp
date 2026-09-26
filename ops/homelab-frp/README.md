# Nomad development FRP tunnel

VM104 (`192.168.31.104`) runs `nomad-frpc.service`. It connects outbound to the Alibaba Cloud Shanghai host `47.101.189.96:7001` and forwards that host's **private** `172.17.0.1:25245` to VM104's `127.0.0.1:43104` development API. The cloud service is `nomad-frps.service`, a separate systemd instance from the existing Docker `frps` on 7000. The old OpenList/Alist port 25244 and `cloud.yinianyunqi.top` proxy host were not changed. Home inbound 80/443 and a router DNAT are not required for this tunnel.

Both ends use frp v0.65.0. The official [release archive](https://github.com/fatedier/frp/releases/tag/v0.65.0) SHA256 is `52ced8c5fdf772f48a9909da4c10c7568c061861946ac9af7a86eeaf14b7e6d5`; verify it before extracting the binaries. The new FRPS permits one proxy on 25245, enforces TLS and token authentication, and has its own randomly generated token. VM104 verifies the FRPS certificate against its dedicated private CA and the DNS name `nomad-frps.yinianyunqi.top` (a TLS identity; the control connection currently uses the IP address). `auth.tokenSource.file` keeps the token out of TOML and Git. The CA private key and server key never leave the cloud host. The token moves directly over pinned SSH into VM104's group-restricted file; it is never displayed or put in a local repo file.

`install-server.sh` and `install-client.sh` are the reviewed provisioning inputs. They expect the matching verified binaries in `/tmp/nomad-frps-0.65.0` and `/tmp/nomad-frpc-0.65.0` on their respective hosts. Install the server first. Prepare the client, transfer `/etc/nomad-frp/server/token` to VM104 `/etc/nomad-frp/client_token` and the public `/etc/nomad-frp/ca/ca.crt` to `/etc/nomad-frp/ca.crt` over authenticated SSH, then run `frpc verify` as `nomad-frpc` and enable its unit. Preserve these server-only files on redeploy; do not regenerate the token or CA while an existing client uses them. The leaf server certificate expires 2027-09-26 UTC and must be renewed before expiry using the retained CA, with a verified reconnect. This private CA is for the FRP control channel, not a public App HTTPS certificate.

Live validation on 2026-09-27: both units were enabled and active; `frps verify` and `frpc verify` passed; FRPC logged successful proxy registration, while a separate invalid-token login was rejected. Cloud host `curl http://172.17.0.1:25245/health` and a request from the existing Nginx Proxy Manager container returned 200. An anonymous `GET /library/import-records` through the tunnel returned 401. The listener was specifically on `172.17.0.1:25245`, and a public-IP request to port 25245 timed out. Each new unit was restarted separately and the tunnel recovered; the old Docker `frps` remained running. Evidence: [`frp-acceptance.json`](../../_bmad-output/implementation-artifacts/evidence/story-1-8-homelab-2026-09-27/frp-acceptance.json).

The development API still uses local-mode Origin/Cookie settings and is **not** a public native HTTPS endpoint. Before placing a Nomad hostname on Nginx Proxy Manager, issue a publicly trusted certificate for that hostname via DNS-01, configure the exact web Origin/native API audience and reverse-proxy HTTPS headers, then verify public DNS, TLS, auth/CORS/CSRF, protected routes, SSE and actual Android/iOS behavior. Do not point the old `cloud.yinianyunqi.top` host or its 25244 route at Nomad. The FRP control port 7001 is public so VM104 can connect; 25245 is bridge-only, and no database, PVE or object-store port is proxied.

Useful checks:

```bash
# VM104
sudo systemctl status nomad-frpc.service
sudo journalctl -u nomad-frpc.service --since today --no-pager
sudo -u nomad-frpc /usr/local/libexec/nomad-frpc verify -c /etc/nomad-frp/frpc.toml

# Alibaba Cloud host
sudo systemctl status nomad-frps.service
sudo -u nomad-frps /usr/local/libexec/nomad-frps verify -c /etc/nomad-frp/server/frps.toml
ss -lntp | grep -E ':(7000|7001|25245)\b'
curl --fail http://172.17.0.1:25245/health
```

For a rollback of this new route, stop/disable `nomad-frpc.service` on VM104 and `nomad-frps.service` on the cloud host. Keep the restricted token, CA, certificate and unit files for recovery; leave the Docker `frps`, OpenList proxy host and development API untouched. This stops only Nomad's private tunnel and does not revert application or database changes.
