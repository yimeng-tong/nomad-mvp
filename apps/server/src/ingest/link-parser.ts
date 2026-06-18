type IngestInput = {
  url?: string | null;
  share_text?: string | null;
};

export type XhsParseResult = {
  url?: string;
  extraUrls: string[];
  warning?: {
    code: 'INGEST_SINGLE_LINK_ONLY';
    message: string;
    extra_count: number;
  };
  error?: {
    code: 'INGEST_XHS_URL_REQUIRED';
    message: string;
  };
};

const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
const trailingPunctuation = /[),.;，。；、）]+$/u;
const xhsHosts = new Set(['xiaohongshu.com', 'www.xiaohongshu.com', 'xhslink.com', 'www.xhslink.com']);

function cleanUrl(value: string) {
  return value.trim().replace(trailingPunctuation, '');
}

export function isXhsUrl(value: string) {
  try {
    const parsed = new URL(cleanUrl(value));
    const hostname = parsed.hostname.toLowerCase();
    return xhsHosts.has(hostname) || hostname.endsWith('.xiaohongshu.com') || hostname.endsWith('.xhslink.com');
  } catch {
    return false;
  }
}

export function normalizeXhsUrl(value: string) {
  const parsed = new URL(cleanUrl(value));
  parsed.hash = '';
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString();
}

export function parseXhsInput(input: IngestInput): XhsParseResult {
  const candidates = [
    ...(input.url ? [input.url] : []),
    ...Array.from(input.share_text?.matchAll(urlPattern) ?? [], (match) => match[0]),
  ]
    .map(cleanUrl)
    .filter(isXhsUrl)
    .map(normalizeXhsUrl);

  const unique = Array.from(new Set(candidates));
  const [url, ...extraUrls] = unique;
  if (!url) {
    return {
      extraUrls: [],
      error: {
        code: 'INGEST_XHS_URL_REQUIRED',
        message: 'a Xiaohongshu URL is required',
      },
    };
  }

  return {
    url,
    extraUrls,
    warning: extraUrls.length
      ? {
          code: 'INGEST_SINGLE_LINK_ONLY',
          message: '一次仅处理一条链接，其余请逐条粘贴',
          extra_count: extraUrls.length,
        }
      : undefined,
  };
}
