const apiRoutes = new Set(['/auth/config', '/auth/otp/start', '/auth/otp/verify', '/me', '/library/cities', '/ingest/workbench-job']);
const assetFiles = /\.(?:m?js|tsx?|css|map|woff2?|svg|png|json)$/;
const assetDirectories = ['/assets/', '/sb-common-assets/', '/sb-addons/', '/sb-preview/', '/node_modules/', '/.storybook/', '/workbench/', '/src/'];

/** Paths outside the API contract are represented by a constant, never copied into diagnostics. */
export function safeRoute(raw: string): string {
  const path = new URL(raw).pathname;
  return apiRoutes.has(path) ? path : '[undeclared]';
}

export function isScenarioApi(request: Request): boolean {
  const path = new URL(request.url).pathname;
  const method = path === '/auth/otp/start' || path === '/auth/otp/verify' ? 'POST' : 'GET';
  return apiRoutes.has(path) && request.method === method;
}

export function isToolAsset(request: Request, origin: string): boolean {
  const url = new URL(request.url);
  if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method)) return false;
  if (['/index.json', '/iframe.html', '/mockServiceWorker.js', '/@react-refresh', '/@vite/client', '/@vite/env'].includes(url.pathname)) return true;
  if (url.pathname.startsWith('/@id/') || url.pathname.startsWith('/__vitest__/')) return true;
  if (url.pathname.startsWith('/@fs/') && /\/(?:node_modules|apps\/mobile|packages\/(?:types|native-auth))\//.test(url.pathname) && assetFiles.test(url.pathname)) return true;
  return assetDirectories.some((prefix) => url.pathname.startsWith(prefix)) && assetFiles.test(url.pathname);
}

export type NetworkViolation = Readonly<{ method: string; route: string; code: string }>;
export class NetworkLedger {
  readonly records: NetworkViolation[] = [];
  constructor(readonly scene: string) {}
  record(request: Request, code: string) {
    this.records.push({ method: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(request.method) ? request.method : 'OTHER', route: safeRoute(request.url), code });
  }
  reject(request: Request, code: string): never {
    this.record(request, code);
    throw new Error('WORKBENCH_NETWORK_BLOCKED');
  }
  assertClean() {
    if (this.records.length) throw new Error(`WORKBENCH_NETWORK_VIOLATION ${JSON.stringify(this.records)}`);
  }
}
