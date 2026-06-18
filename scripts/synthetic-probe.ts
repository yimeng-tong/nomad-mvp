import fetch from 'node-fetch';

const API = process.env.API_BASE || 'http://localhost:3000';
const traceId = `syn_${Date.now()}`;

async function probeIngest() {
  const r = await fetch(`${API}/ingest/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Trace-Id': traceId, 'X-Device-Id': 'syn-device' }, body: JSON.stringify({ source: 'xhs', url: 'https://xhs.example/123' }) });
  if (r.status !== 202) throw new Error('ingest ack failed');
  const j = await r.json();
  console.log('ingest ack', j);
  return j;
}

async function probePlan() {
  const r = await fetch(`${API}/plan/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Trace-Id': traceId, 'X-Device-Id': 'syn-device' }, body: JSON.stringify({ city: '杭州', start_date: '2025-11-02', days: 3 }) });
  if (r.status !== 202) throw new Error('plan ack failed');
  const j = await r.json();
  console.log('plan ack', j);
  return j;
}

async function probeFill(planId: string) {
  const r = await fetch(`${API}/plan/ai-fill`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Trace-Id': traceId, 'X-Device-Id': 'syn-device' }, body: JSON.stringify({ plan_id: planId }) });
  if (r.status !== 202) throw new Error('fill ack failed');
  const j = await r.json();
  console.log('fill ack', j);
  return j;
}

async function probeExport(planId: string) {
  const r = await fetch(`${API}/export/png`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Trace-Id': traceId, 'X-Device-Id': 'syn-device' }, body: JSON.stringify({ plan_id: planId, width_px: 1080, slice_by_day: true }) });
  if (r.status !== 200) throw new Error('export failed');
  const j = await r.json();
  console.log('export ok', j.format, j.files.length);
}

async function main() {
  const ing = await probeIngest();
  const plan = await probePlan();
  await probeFill(plan.plan_id);
  await probeExport(plan.plan_id);
  console.log('synthetic probe ok');
}

main().catch((e) => { console.error(e); process.exit(1); });


