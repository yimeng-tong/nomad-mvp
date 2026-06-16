# BMAD Cleanup Notes

Date: 2026-06-17

## Summary

The project baseline now uses BMAD 6.8 from the migration recovery merge.
The active BMAD installation is:

- `_bmad/`
- `_bmad-output/`
- `.agents/skills/`

Legacy BMAD v6 alpha and old Cursor rule exports were removed from the tracked
project tree to prevent Codex/Cursor from reading conflicting instructions.

## Removed From Tracked Source

- `bmad/`
  - Previous BMAD `6.0.0-alpha.4` install.
  - Superseded by `_bmad/_config/manifest.yaml` with BMAD `6.8.0`.
- `.cursor/rules/bmad/`
  - Old generated Cursor rules.
  - Superseded by `.agents/skills/`, which BMAD 6.8 targets for both Codex and Cursor.
- Old `AGENTS.md` BMAD block
  - Referenced `.bmad-core`, which is not present in the active project root.
  - Replaced with a concise project-specific guide pointing at BMAD 6.8 paths.

## Preserved

- `_bmad/` and `.agents/skills/` remain the authoritative BMAD/Codex/Cursor setup.
- `_bmad-output/` remains the planning and implementation artifact output root.
- Existing planning docs remain in `docs/`, including the PRD, architecture docs,
  and epic tech specs.

## Local Ignored Backup

`v4-backup/.bmad-core/` is ignored by git and is not part of the tracked cleanup.
It can be removed locally after the team is comfortable that no v4 reference
material is needed.

## Next Step

Use BMAD 6.8 skills to rebuild the sprint/story queue from the existing planning
inputs, then select the first small implementation story.
