import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FullConfig } from 'playwright/test';
import contract from './run-contract.json' with { type: 'json' };

export default function setup(config: FullConfig) {
  assert.equal(config.updateSnapshots, 'none', 'NOMAD_E2E_AUTO_UPDATE_FORBIDDEN');
  const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const root = resolve(mobile, '../..');
  const runId = process.env.NOMAD_BROWSER_RUN_ID!;
  const git = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '--', ...contract.sourceInputs]).split('\n').filter(Boolean).sort();
  const hashes = Object.fromEntries(files.map((file) => [file, existsSync(resolve(root, file))
    ? createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex') : 'MISSING']));
  const graph = readFileSync(resolve(mobile, '.workbench-results/product-graph.json'));
  const directory = resolve(mobile, '.browser-results/runs', runId);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'source-manifest.json'), JSON.stringify({ kind: 'actual-browser-run-inputs', sourceRevision: git(['rev-parse', 'HEAD']),
    githubRunId: process.env.GITHUB_RUN_ID ?? null,
    runId, runKind: process.env.NOMAD_BROWSER_RUN_KIND ?? 'local', sourceHashes: hashes,
    productGraphHash: createHash('sha256').update(graph).digest('hex'), snapshotUpdates: config.updateSnapshots,
    declaredProjects: config.projects.map((project) => project.name), recordedAt: new Date().toISOString() }, null, 2) + '\n');
}
