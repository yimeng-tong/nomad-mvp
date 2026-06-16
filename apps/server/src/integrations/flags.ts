import { initialize, Unleash } from 'unleash-client';

let client: Unleash | null = null;

export async function initFlags() {
  if (!process.env.UNLEASH_URL || !process.env.UNLEASH_API_TOKEN) return;
  client = await initialize({ url: process.env.UNLEASH_URL!, appName: 'nomad-server', customHeaders: { Authorization: process.env.UNLEASH_API_TOKEN! } });
}

export function isEnabled(flag: string, fallback = false) {
  if (!client) return fallback;
  return client.isEnabled(flag);
}


