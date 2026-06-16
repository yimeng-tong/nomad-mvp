import { getPrisma } from '../db/prisma.js';
import { validateFillOutput } from './validator.js';

export async function persistFillOutput(planId: string, output: { items: Array<{ slot_id: string, do: string[], prepare?: string[], notice?: string[] }> }) {
  const prisma = getPrisma();
  if (!prisma) return;
  const run = await prisma.fillRun.create({ data: { planId, status: 'done' } as any });
  for (const it of output.items) {
    await prisma.fillItem.create({ data: { fillRunId: run.id, slotId: it.slot_id, doText: it.do, prepare: it.prepare ?? [], notice: it.notice ?? [], validation: 'ok' } as any });
  }
}

export function validateOrThrow(output: unknown) {
  const v = validateFillOutput(output);
  if (!v.ok) {
    const err = new Error('FILL_VALIDATION_FAILED');
    (err as any).details = v.errors;
    throw err;
  }
}


