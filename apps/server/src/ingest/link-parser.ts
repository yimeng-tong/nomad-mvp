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

export function cleanXhsUrl(value: string) {
  return value.trim().replace(trailingPunctuation, '');
}

export function isXhsUrl(value: string) {
  try {
    const parsed = new URL(cleanXhsUrl(value));
    const hostname = parsed.hostname.toLowerCase();
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password && !parsed.port
      && (xhsHosts.has(hostname) || hostname.endsWith('.xiaohongshu.com') || hostname.endsWith('.xhslink.com'));
  } catch {
    return false;
  }
}

export function normalizeXhsUrl(value: string) {
  const parsed = new URL(cleanXhsUrl(value));
  parsed.hash = '';
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString();
}

export function parseXhsInput(input: IngestInput): XhsParseResult {
  const candidates = [
    ...(input.url ? [input.url] : []),
    ...Array.from(input.share_text?.matchAll(urlPattern) ?? [], (match) => match[0]),
  ]
    .map(cleanXhsUrl)
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


export type XhsBatch = {
  links: Array<{ url: string; original_url: string; position: number }>;
  link_occurrences: Array<{ url: string; position: number }>;
  unrecognized: Array<{ text: string; reason: 'unsupported_url' | 'not_a_link' }>;
  duplicate_count: number;
};
/** The same basic normalizer as the single-link route, not Story1.8 canonical/short-link resolution. */
export function parseXhsBatch(text: string): XhsBatch {
  const result: XhsBatch = { links: [], link_occurrences: [], unrecognized: [], duplicate_count: 0 };
  const seen = new Set<string>(); let end = 0;
  const unknown = (value: string, reason: 'unsupported_url' | 'not_a_link') => {
    const trimmed = value.trim().replace(/^[),.;，。；、）\s]+|[),.;，。；、）\s]+$/gu, '');
    if (trimmed) result.unrecognized.push({ text: trimmed, reason });
  };
  // Some shares join URLs with Chinese punctuation and no spaces.
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>，。；、）]+/gi)) {
    unknown(text.slice(end, match.index), 'not_a_link'); end = match.index + match[0].length;
    const candidate = cleanXhsUrl(match[0]);
    if (!isXhsUrl(candidate)) { unknown(candidate, 'unsupported_url'); continue; }
    const url = normalizeXhsUrl(candidate);
    result.link_occurrences.push({ url, position: match.index });
    if (seen.has(url)) { result.duplicate_count++; continue; }
    seen.add(url); result.links.push({ url, original_url: candidate, position: match.index });
  }
  unknown(text.slice(end), 'not_a_link');
  return result;
}
