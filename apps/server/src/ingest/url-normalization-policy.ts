import { cleanXhsUrl, isXhsUrl } from './link-parser.js';

export const XHS_IMPORT_URL_POLICY_VERSION = 'xhs-import-v1' as const;

export type ImportUrlDecision = {
  originalUrl: string;
  normalizedUrl: string;
  policyVersion: typeof XHS_IMPORT_URL_POLICY_VERSION;
  resolution: 'direct' | 'short-unresolved' | 'short-resolved';
};

type Resolution = { resolvedUrl?: string };

const shortHosts = new Set(['xhslink.com', 'www.xhslink.com']);
const directHosts = new Set(['xiaohongshu.com', 'www.xiaohongshu.com']);
const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const supportedNotePath = /^\/(?:explore\/[^/]+|discovery\/item\/[^/]+|user\/profile\/[^/]+\/[^/]+)$/u;
const supportedShortPath = /^\/[^/]+$/u;

function unsupported(): never {
  throw new Error('INGEST_URL_POLICY_UNSUPPORTED');
}

function parseSupported(value: string): URL {
  if (Buffer.byteLength(value, 'utf8') > 4096 || !isXhsUrl(value)) unsupported();
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') unsupported();
  const path = url.pathname.replace(/\/+$/u, '');
  if (directHosts.has(url.hostname) ? !supportedNotePath.test(path)
    : shortHosts.has(url.hostname) ? !supportedShortPath.test(path) : true) unsupported();
  return url;
}

function normalize(url: URL): string {
  url.protocol = 'https:';
  url.hash = '';
  if (directHosts.has(url.hostname)) url.hostname = 'www.xiaohongshu.com';
  if (shortHosts.has(url.hostname)) url.hostname = 'xhslink.com';
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/u, '');
  for (const name of trackingParams) url.searchParams.delete(name);
  const normalized = url.toString();
  if (Buffer.byteLength(normalized, 'utf8') > 2048) unsupported();
  return normalized;
}

/** Pure policy decision. Resolution is supplied by a separate, bounded adapter; this function never fetches. */
export function normalizeImportSourceUrl(value: string, resolution: Resolution = {}): ImportUrlDecision {
  const originalUrl = cleanXhsUrl(value);
  const source = parseSupported(originalUrl);
  const isShort = shortHosts.has(source.hostname);
  if (resolution.resolvedUrl !== undefined) {
    if (!isShort) unsupported();
    const target = parseSupported(resolution.resolvedUrl);
    if (!directHosts.has(target.hostname)) unsupported();
    return { originalUrl, normalizedUrl: normalize(target), policyVersion: XHS_IMPORT_URL_POLICY_VERSION,
      resolution: 'short-resolved' };
  }
  return { originalUrl, normalizedUrl: normalize(source), policyVersion: XHS_IMPORT_URL_POLICY_VERSION,
    resolution: isShort ? 'short-unresolved' : 'direct' };
}
