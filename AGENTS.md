# Project Agents

This repository uses BMAD 6.8 with Codex/Cursor skills generated under
`.agents/skills`.

## Project Context

- Project: `nomad-mvp`, a travel assistant MVP.
- Primary working directory: `/home/tong123/work/nomad-mvp`.
- Work in WSL Ubuntu. Do not use Windows-native Node or pnpm for project commands.
- Do not copy files from the old Windows/E-drive migration image.

## Current Tooling

- BMAD manifest: `_bmad/_config/manifest.yaml`.
- BMAD outputs: `_bmad-output/`.
- Codex/Cursor skills: `.agents/skills/`.
- Legacy BMAD v4/v5/v6-alpha paths are intentionally not authoritative.

## Development Commands

- Install dependencies: `pnpm install --frozen-lockfile`
- Generate OpenAPI types: `pnpm -F nomad-types run generate`
- Build workspace: `pnpm -r build`

## Working Notes

- Keep `.env`, logs, and build outputs out of git.
- Use `docs/prd.md`, `docs/architecture/`, `docs/tech-spec-epic-2.md`, and
  `docs/tech-spec-epic-3.md` as planning inputs.
- `docs/stories/` is the intended location for implementation stories.
