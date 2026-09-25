import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkIsolation } from './check-workbench-isolation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
checkIsolation({ native: false });
const graph = JSON.parse(readFileSync(resolve(root, '.workbench-results/product-graph.json'), 'utf8'));
const nonce = process.env.NOMAD_BROWSER_SERVER_NONCE;
if (!nonce) throw new Error('Owned browser server nonce required');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://127.0.0.1:4175').pathname;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (path === '/__nomad_browser_ready') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ nonce }));
    return;
  }
  if (path.startsWith('/api/')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error_code: 'AUTH_AUTHORITY_UNAVAILABLE', error_message: 'Synthetic unavailable API', retriable: true }));
    return;
  }
  if (path === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const name = path === '/' || path === '/ops' ? 'index.html' : path.slice(1);
  const file = resolve(dist, name);
  if (!['GET', 'HEAD'].includes(req.method ?? '') || !file.startsWith(dist + sep) || !Object.hasOwn(graph.outputs, name)) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
});
server.listen(4175, '127.0.0.1');
const close = () => { server.closeAllConnections(); server.close(); };
process.once('SIGINT', close);
process.once('SIGTERM', close);
