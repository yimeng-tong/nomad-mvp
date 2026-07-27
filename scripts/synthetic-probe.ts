import fetch from 'node-fetch';
import EventSource from 'eventsource';

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
    body: JSON.stringify({
      share_text: `https://xhslink.com/${traceId} https://www.xiaohongshu.com/explore/${traceId}-extra`,
    }),
  });
  if (r.status !== 202) throw new Error('ingest ack failed');
  const j = (await r.json()) as { sse_url?: string; warning?: { code?: string } };
  console.log('ingest ack', j);
  if (!j.sse_url?.startsWith('/ingest/')) throw new Error('canonical ingest SSE URL missing');
  if (j.warning?.code !== 'INGEST_SINGLE_LINK_ONLY') throw new Error('multi-link ingest warning missing');

  const legacy = await fetch(`${API}/ingest/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ source: 'xhs', url: `https://www.xiaohongshu.com/explore/${traceId}-legacy` }),
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
    body: JSON.stringify({
      city: '杭州',
      start_date: '2025-11-02',
      days: 3,
      pace: 'comfortable',
      rec_id: traceId,
      hotels: [{ date: '2025-11-02', leave_blank: true, breakfast_included: false }],
      luggage_plan: { mode: 'undecided', hotel_change_help_needed: false },
      wake_preference: '08:30',
      morning_start_time: '09:30',
      smart_planning: true,
    }),
  });
  if (r.status !== 202) throw new Error('plan ack failed');
  const j = (await r.json()) as { plan_id: string; sse_url: string };
  console.log('plan ack', j);
  await waitForPlanDone(j.sse_url);

  const ready = await fetch(`${API}/plan/${j.plan_id}`, { headers });
  if (ready.status !== 200) {
    throw new Error(`plan result failed (${ready.status}): ${await ready.text()}`);
  }
  const plan = (await ready.json()) as {
    plan_rev: number;
    day_plans?: Array<{
      slots: Array<{
        slot_id: string;
        type: string;
        title?: string | null;
        constraint?: unknown | null;
      }>;
    }>;
  };
  if (!Array.isArray(plan.day_plans) || plan.day_plans.length !== 3) {
    throw new Error('plan result is missing persisted day plans');
  }
  return { ...j, plan };
}

async function probePlanEdit(input: Awaited<ReturnType<typeof probePlan>>) {
  let plan = input.plan;
  let slot = plan.day_plans?.flatMap((day) => day.slots)
    .find((candidate) =>
      candidate.type !== 'hotel'
      && candidate.type !== 'unresolved'
      && !candidate.constraint,
    );
  if (!slot) {
    slot = plan.day_plans?.flatMap((day) => day.slots)
      .find((candidate) => candidate.type === 'unresolved');
  }
  if (!slot) throw new Error('plan edit probe has no editable or resolvable timeline slot');
  if (slot.type === 'unresolved') {
    const resolved = await fetch(`${API}/plan/${input.plan_id}/slots/${slot.slot_id}/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        op: 'set_free_activity',
        expected_plan_rev: plan.plan_rev,
      }),
    });
    if (resolved.status !== 200) {
      throw new Error(`plan edit setup failed (${resolved.status}): ${await resolved.text()}`);
    }
    const refreshed = await fetch(`${API}/plan/${input.plan_id}`, { headers });
    plan = await refreshed.json() as typeof plan;
    slot = plan.day_plans?.flatMap((day) => day.slots)
      .find((candidate) => candidate.slot_id === slot!.slot_id);
  }
  if (!slot) throw new Error('plan edit probe lost its timeline slot');
  const beforeType = slot.type;
  const edit = await fetch(`${API}/plan/${input.plan_id}/slots/${slot.slot_id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      op: 'delete',
      expected_plan_rev: plan.plan_rev,
      operation_id: `synthetic-edit-${traceId}`,
    }),
  });
  if (edit.status !== 200) {
    throw new Error(`plan edit failed (${edit.status}): ${await edit.text()}`);
  }
  const editBody = await edit.json() as {
    plan_rev: number;
    edit_event_id: string;
    undo_token: string;
    changed_slot: { type: string };
  };
  if (editBody.changed_slot.type !== 'unresolved') {
    throw new Error('plan delete did not preserve an unresolved timeline position');
  }
  const editedRead = await fetch(`${API}/plan/${input.plan_id}`, { headers });
  const editedPlan = await editedRead.json() as typeof plan;
  const editedSlot = editedPlan.day_plans?.flatMap((day) => day.slots)
    .find((candidate) => candidate.slot_id === slot!.slot_id);
  if (editedSlot?.type !== 'unresolved') throw new Error('persisted plan edit readback failed');

  const undo = await fetch(`${API}/plan/${input.plan_id}/edits/undo`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      expected_plan_rev: editBody.plan_rev,
      undo_token: editBody.undo_token,
    }),
  });
  if (undo.status !== 200) {
    throw new Error(`plan edit undo failed (${undo.status}): ${await undo.text()}`);
  }
  const restoredRead = await fetch(`${API}/plan/${input.plan_id}`, { headers });
  const restoredPlan = await restoredRead.json() as typeof plan;
  const restoredSlot = restoredPlan.day_plans?.flatMap((day) => day.slots)
    .find((candidate) => candidate.slot_id === slot!.slot_id);
  if (restoredSlot?.type !== beforeType) throw new Error('persisted plan edit undo readback failed');
  console.log('plan edit undo ok', editBody.edit_event_id);
}

function waitForPlanDone(sseUrl: string, timeoutMs = 15_000) {
  return new Promise<void>((resolve, reject) => {
    const source = new EventSource(`${API}${sseUrl}`, { headers: headers as any });
    let connectionErrors = 0;
    const timer = setTimeout(() => {
      source.close();
      reject(new Error(`plan terminal event timeout after ${connectionErrors} connection errors`));
    }, timeoutMs);
    source.addEventListener('plan', (event: any) => {
      const data = JSON.parse(event.data) as {
        phase?: string;
        error_code?: string;
        error_message?: string;
      };
      if (data.phase === 'failed') {
        clearTimeout(timer);
        source.close();
        reject(new Error(`plan failed: ${data.error_code ?? 'unknown'} ${data.error_message ?? ''}`.trim()));
      } else if (data.phase === 'done') {
        clearTimeout(timer);
        source.close();
        resolve();
      }
    });
    source.addEventListener('error', () => {
      connectionErrors += 1;
    });
  });
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
  if (!Array.isArray(j.files) || j.files.length === 0) throw new Error('export files missing');
  console.log('export ok', j.format, j.files?.length);
}

async function main() {
  await probeIngest();
  const plan = await probePlan();
  await probePlanEdit(plan);
  await probeFill(plan.plan_id);
  await probeExport(plan.plan_id);
  console.log('synthetic probe ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
