import EventSource from 'eventsource';

const API = process.env.API_BASE || 'http://localhost:3000';
const traceId = `syn_${Date.now()}`;
const headers = { 'X-Trace-Id': traceId, 'X-User-Id': '00000000-0000-4000-8000-000000000001', 'X-Device-Id': 'syn-device' };

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

function assertIngestStages(url: string, timeoutMs = 5000) {
  return new Promise<void>((resolve, reject) => {
    const es = new EventSource(`${API}${url}`, { headers: headers as any });
    const states: string[] = [];
    const subStages: string[] = [];
    const timer = setTimeout(() => {
      es.close();
      reject(new Error(`ingest stage timeout: ${states.join(',')}`));
    }, timeoutMs);
    es.addEventListener('ingest', (event: any) => {
      const data = JSON.parse(event.data);
      states.push(data.state);
      if (data.sub_stage) subStages.push(data.sub_stage);
      if (data.state === 'failed') {
        clearTimeout(timer);
        es.close();
        reject(new Error(`ingest failed: ${data.error_code ?? 'unknown'}`));
        return;
      }
      if (data.state === 'done') {
        clearTimeout(timer);
        es.close();
        const required = ['created', 'fetching', 'parsing', 'geo', 'storing', 'done'];
        const missing = required.filter((state) => !states.includes(state));
        if (missing.length > 0) reject(new Error(`ingest missing stages: ${missing.join(',')}`));
        else if (subStages.join(',') !== 'text,ocr,vision') reject(new Error(`ingest parsing sub-stages mismatch: ${subStages.join(',')}`));
        else resolve();
      }
    });
    es.addEventListener('error', () => {
      clearTimeout(timer);
      es.close();
      reject(new Error('ingest SSE error'));
    });
  });
}

async function main() {
  // derive URLs by triggering ack first (ingest)
  const r1 = await fetch(`${API}/ingest/xhs`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://www.xiaohongshu.com/explore/sse' }) } as any);
  const j1 = await r1.json() as any;
  await assertTTFU(j1.sse_url, 'ingest');
  await assertIngestStages(j1.sse_url);
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


