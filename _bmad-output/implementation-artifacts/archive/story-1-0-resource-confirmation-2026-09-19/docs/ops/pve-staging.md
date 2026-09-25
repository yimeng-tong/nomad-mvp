# PVE Staging Environment

## Scope

This is a private-LAN staging environment for validating `nomad-mvp` against
real PostgreSQL, Redis, systemd, Nginx, and Puppeteer. It is not a public
production environment.

| Item | Value |
| --- | --- |
| PVE host | `192.168.31.2` |
| VM | `104` / `nomad-staging` |
| VM address | `192.168.31.104/24` |
| Guest | Ubuntu 24.04 cloud image |
| Compute | 4 vCPU, 8 GiB maximum / 4 GiB balloon floor |
| Disk | 64 GiB on `local-lvm` |
| Web | `http://192.168.31.104` |
| API | `http://192.168.31.104/api` |

VM 104 has no `hostpci` or HBA passthrough and has `onboot=0`. It is independent
of the OMV and HBA test VMs.

## Access

The guest user is `nomad` and accepts the homelab ED25519 public key. From WSL,
use Windows OpenSSH because the Windows key appears too permissive through
DrvFs:

```bash
/mnt/c/Windows/System32/OpenSSH/ssh.exe \
  -i 'C:\Users\123\.ssh\id_ed25519' \
  nomad@192.168.31.104
```

Do not copy the private key into this repository, `/tmp`, or the guest.

## Runtime

- Node `22.22.1`
- pnpm `11.7.0`
- PostgreSQL `16`
- Redis `7`
- Nginx `1.24`
- App release root: `/opt/nomad-mvp/releases/`
- Active release: `/opt/nomad-mvp/current`
- Secret environment: `/etc/nomad-mvp/nomad.env`
- API service: `nomad-server.service`

The environment file is generated inside the guest and is mode `0640`,
`root:nomad`. Never print or copy it into Git.

## Bootstrap

Run `ops/pve-staging/bootstrap-ubuntu.sh` as `nomad` on a fresh Ubuntu guest.
It installs the database, cache, proxy, Puppeteer runtime libraries, Chinese
fonts, and the pinned Node/pnpm toolchain.

## Deploy

Deploy only a clean Git commit. Create an archive in WSL:

```bash
commit="$(git rev-parse --short=12 HEAD)"
git archive --format=tar.gz --output="/tmp/nomad-mvp-${commit}.tar.gz" HEAD
sha256sum "/tmp/nomad-mvp-${commit}.tar.gz"
```

Copy the archive and `ops/pve-staging/` to the guest with Windows `scp.exe`,
then run:

```bash
/tmp/pve-staging/deploy-release.sh \
  "/tmp/nomad-mvp-${commit}.tar.gz" \
  "${commit}" \
  "<sha256>"
```

The deploy script verifies the archive, installs dependencies, applies
`prisma migrate deploy`, builds the workspace, rebuilds mobile with
`VITE_API_BASE_URL=/api`, switches `current`, and restarts the services.

Rollback is an atomic symlink switch followed by service restart:

```bash
sudo ln -sfn /opt/nomad-mvp/releases/<previous-release> /opt/nomad-mvp/current
sudo systemctl restart nomad-server
sudo systemctl reload nginx
```

Database migrations are forward-only. Take a database backup before deploying
a destructive migration.

## Verification

```bash
curl -fsS http://192.168.31.104/api/health
TMPDIR=/tmp API_BASE=http://192.168.31.104/api \
  pnpm exec tsx scripts/synthetic-probe.ts
TMPDIR=/tmp API_BASE=http://192.168.31.104/api \
  pnpm exec tsx scripts/sse-assert.ts
```

Also verify:

```bash
systemctl is-active nomad-server postgresql redis-server nginx
redis-cli ping
sudo -u postgres psql -d nomad_staging \
  -c 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name'
```

## Security Notes

- PostgreSQL and Redis listen only on loopback.
- UFW permits only SSH and HTTP from `192.168.31.0/24`.
- The API listens on guest port 3000 but UFW prevents direct LAN access; Nginx
  is the supported entry point.
- Puppeteer uses the repository's `CI` no-sandbox flags because systemd keeps
  `NoNewPrivileges=true`. This is acceptable for private staging with trusted
  render content. Public production should isolate export in a dedicated
  worker or container with a browser sandbox.
- PVE reports thin-provisioned virtual capacity above the physical thin-pool
  size. Current actual free space is healthy, but host storage monitoring is
  required before adding more large virtual disks.

To remove this environment, stop and destroy VM `104` only after confirming its
VMID and name. Never alter VMs `189` or `190` as part of Nomad staging work.
