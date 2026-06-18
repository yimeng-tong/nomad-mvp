import EventSource from 'eventsource';

const API = process.env.API_BASE || 'http://localhost:3000';
const traceId = `syn_${Date.now()}`;
const headers = { 'X-Trace-Id': traceId, 'X-User-Id': 'ci-synthetic-user', 'X-Device-Id': 'syn-device' };

function assertTTFU(url: string, label: string, timeoutMs = 1500) {
  return new Promise<void>((resolve, reject) => {
    const es = new EventSource(`${API}${url}`, { headers: headers as any });
    const timer = setTimeout(() => { es.close(); reject(new Error(`${label} TTFU timeout`)); }, timeoutMs);
    const onAny = () => { clearTimeout(timer); es.close(); resolve(); };
    es.addEventListener('ingest', onAny);
    es.addEventListener('plan', onAny);
    es.addEventListener('fill', onAny);
  });
}

function assertKeepAlive(url: string, label: string, maxGapMs = 12000, testDurationMs = 22000) {
  return new Promise<void>((resolve, reject) => {
    const es = new EventSource(`${API}${url}`, { headers: headers as any });
    let last = Date.now();
    const onAny = () => { last = Date.now(); };
    const interval = setInterval(() => {
      if (Date.now() - last > maxGapMs) {
        clearInterval(interval); es.close(); reject(new Error(`${label} keepalive gap`));
      }
    }, 1000);
    setTimeout(() => { clearInterval(interval); es.close(); resolve(); }, testDurationMs);
    es.addEventListener('ping', onAny);
    es.addEventListener('ingest', onAny);
    es.addEventListener('plan', onAny);
    es.addEventListener('fill', onAny);
  });
}

async function main() {
  // derive URLs by triggering ack first (ingest)
  const r1 = await fetch(`${API}/ingest/start`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'xhs' }) } as any);
  const j1 = await r1.json() as any;
  await assertTTFU(j1.sse_url, 'ingest');
  await assertKeepAlive(j1.sse_url, 'ingest');

  const r2 = await fetch(`${API}/plan/generate`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ city: '杭州', start_date: '2025-11-02', days: 1 }) } as any);
  const j2 = await r2.json() as any;
  await assertTTFU(j2.sse_url, 'plan');
  await assertKeepAlive(j2.sse_url, 'plan');

  const r3 = await fetch(`${API}/plan/ai-fill`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: j2.plan_id }) } as any);
  const j3 = await r3.json() as any;
  await assertTTFU(j3.sse_url, 'fill');
  await assertKeepAlive(j3.sse_url, 'fill');

  console.log('SSE gates ok');
}

main().catch((e) => { console.error(e); process.exit(1); });


