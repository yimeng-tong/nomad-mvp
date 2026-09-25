import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Record what the real product bundler consumed, outside its distributable directory. */
export function productBuildProof(): Plugin {
  let root = '';
  return {
    name: 'nomad-product-build-proof',
    apply: 'build',
    configResolved(config) { root = config.root; },
    generateBundle(_options, bundle) {
      if (process.env.NOMAD_RECORD_PRODUCT_GRAPH !== '1') return;
      const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
      const chunks = Object.values(bundle).filter((item) => item.type === 'chunk');
      const ids = [...new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules)))].sort();
      const modules = ids.map((id) => {
        const path = id.split('?')[0];
        return { id: id.startsWith('\0') ? `[virtual]${id.slice(1)}` : relative(root, id), sha256: existsSync(path) ? digest(path) : null };
      });
      const output = resolve(root, '.workbench-results');
      mkdirSync(output, { recursive: true });
      writeFileSync(resolve(output, 'product-graph.json'), JSON.stringify({
        kind: 'actual-product-module-graph', entry: 'src/main.tsx', entrySha256: digest(resolve(root, 'src/main.tsx')),
        outputs: Object.keys(bundle).sort(), modules,
      }, null, 2) + '\n');
    },
  };
}
