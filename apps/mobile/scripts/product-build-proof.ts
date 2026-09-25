import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Bind the actual product module graph to the final emitted and copied bytes. */
export function productBuildProof(): Plugin {
  let root = '';
  let directory = '';
  let modules: { id: string; sha256: string | null }[] = [];
  const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const outputs = (prefix = ''): [string, string][] => readdirSync(resolve(directory, prefix), { withFileTypes: true }).flatMap((entry) => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? outputs(name) : [[name, digest(resolve(directory, name))]];
  });
  return {
    name: 'nomad-product-build-proof',
    apply: 'build',
    configResolved(config) { root = config.root; directory = resolve(root, config.build.outDir); },
    generateBundle(_options, bundle) {
      if (process.env.NOMAD_RECORD_PRODUCT_GRAPH !== '1') return;
      const chunks = Object.values(bundle).filter((item) => item.type === 'chunk');
      const ids = [...new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules)))].sort();
      modules = ids.map((id) => {
        const path = id.split('?')[0];
        return { id: id.startsWith('\0') ? `[virtual]${id.slice(1)}` : relative(root, id), sha256: existsSync(path) ? digest(path) : null };
      });
    },
    writeBundle() {
      if (process.env.NOMAD_RECORD_PRODUCT_GRAPH !== '1') return;
      const output = resolve(root, '.workbench-results');
      mkdirSync(output, { recursive: true });
      writeFileSync(resolve(output, 'product-graph.json'), JSON.stringify({
        kind: 'actual-product-module-graph', entry: 'src/main.tsx', entrySha256: digest(resolve(root, 'src/main.tsx')),
        outputs: Object.fromEntries(outputs().sort(([a], [b]) => a.localeCompare(b))), modules,
      }, null, 2) + '\n');
    },
  };
}
