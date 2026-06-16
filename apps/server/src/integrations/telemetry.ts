import * as Sentry from '@sentry/node';
import { Langfuse } from 'langfuse';

export const sentryInit = () => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
};

export const langfuse = (() => {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_HOST) return null as unknown as Langfuse | null;
  return new Langfuse({ publicKey: process.env.LANGFUSE_PUBLIC_KEY!, secretKey: process.env.LANGFUSE_SECRET_KEY!, baseUrl: process.env.LANGFUSE_HOST! });
})();

export function trackFillRun(meta: { prompt_ver: string, model_ver: string, seed?: string|number, cost?: number, latency_ms?: number, trace_id: string }) {
  if (!langfuse) return;
  langfuse.trace({ name: 'fill_run', input: { prompt_ver: meta.prompt_ver, model_ver: meta.model_ver, seed: meta.seed }, metadata: { cost: meta.cost, latency_ms: meta.latency_ms, trace_id: meta.trace_id } });
}


