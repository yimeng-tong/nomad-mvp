import fetch from 'node-fetch';

const API = process.env.API_BASE || 'http://localhost:3000';
const traceId = `syn_${Date.now()}`;
const headers = {
  'Content-Type': 'application/json',
  'X-Trace-Id': traceId,
  'X-Device-Id': 'syn-device',
  'X-User-Id': '00000000-0000-4000-8000-000000000001',
};

async function probeIngest() {
  const r = await fetch(`${API}/ingest/xhs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ share_text: 'https://xhslink.com/123 https://www.xiaohongshu.com/explore/456' }),
  });
  if (r.status !== 202) throw new Error('ingest ack failed');
  const j = (await r.json()) as { sse_url?: string; warning?: { code?: string } };
  console.log('ingest ack', j);
  if (!j.sse_url?.startsWith('/ingest/')) throw new Error('canonical ingest SSE URL missing');
  if (j.warning?.code !== 'INGEST_SINGLE_LINK_ONLY') throw new Error('multi-link ingest warning missing');

  const legacy = await fetch(`${API}/ingest/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ source: 'xhs', url: 'https://www.xiaohongshu.com/explore/legacy' }),
  });
  if (legacy.status !== 202) throw new Error('legacy ingest ack failed');
  const legacyJson = (await legacy.json()) as { sse_url?: string };
  if (!legacyJson.sse_url?.startsWith('/sse/ingest/')) throw new Error('legacy ingest SSE URL missing');
  return j;
}

async function probePlan() {
  const r = await fetch(`${API}/plan/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ city: '杭州', start_date: '2025-11-02', days: 3 }),
  });
  if (r.status !== 202) throw new Error('plan ack failed');
  const j = (await r.json()) as { plan_id: string };
  console.log('plan ack', j);
  return j;
}

async function probeFill(planId: string) {
  const r = await fetch(`${API}/plan/ai-fill`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ plan_id: planId }),
  });
  if (r.status !== 202) throw new Error('fill ack failed');
  const j = await r.json();
  console.log('fill ack', j);
  return j;
}

async function probeExport(planId: string) {
  const r = await fetch(`${API}/export/png`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ plan_id: planId, width_px: 1080, slice_by_day: true }),
  });
  if (r.status !== 200) {
    const body = await r.text();
    throw new Error(`export failed (${r.status}): ${body}`);
  }
  const j = (await r.json()) as { format?: string; files?: unknown[] };
  console.log('export ok', j.format, j.files?.length);
}

async function main() {
  await probeIngest();
  const plan = await probePlan();
  await probeFill(plan.plan_id);
  await probeExport(plan.plan_id);
  console.log('synthetic probe ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
