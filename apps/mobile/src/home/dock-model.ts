import type { components } from 'nomad-types/src/api-types';
export type Snapshot = components['schemas']['IngestSnapshot'];
export type DockEntry = {
  id: string; batchId: string; position: number; total: number; url: string;
  acceptance: 'pending' | 'accepted' | 'unknown' | 'rejected';
  disposition?: 'created' | 'reused' | 'retried'; jobId?: string; snapshot?: Snapshot;
  connectionLost: boolean; errorCode?: string; eligibleCompletion: boolean;
};
export type Batch = { id: string; entries: Array<{ id: string; url: string }>; unrecognized: Array<{ text: string; reason: string }>; duplicates: number; restored?: boolean };
export type Completion = { key: string; jobId: string; entryId: string; snapshot: Snapshot; remainingMs: number };
export type DockState = {
  input: string; expanded: boolean; visible: boolean; batches: Batch[]; entries: DockEntry[];
  presenting: Completion | null; completions: Completion[]; seen: string[];
};
export function emptyDock(): DockState {
  return { input: '', expanded: true, visible: false, batches: [], entries: [], presenting: null, completions: [], seen: [] };
}
export function addBatch(state: DockState, batch: Batch): DockState {
  if (state.batches.some((item) => item.id === batch.id)) return state;
  return { ...state, batches: [...state.batches, batch], entries: [...state.entries, ...batch.entries.map((entry, index): DockEntry => ({
    ...entry, batchId: batch.id, position: index + 1, total: batch.entries.length,
    acceptance: 'pending', connectionLost: false, eligibleCompletion: true,
  }))] };
}
export function acceptEntry(state: DockState, id: string, receipt: { disposition: 'created' | 'reused' | 'retried'; snapshot: Snapshot }, observedDoneAttempt = 0, completionEligible?:boolean): DockState {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return state;
  const next = { ...state, entries: state.entries.map((item) => item.id === id ? { ...item,
    acceptance: 'accepted' as const, jobId: receipt.snapshot.ingest_id, disposition: receipt.disposition,
    errorCode: undefined, eligibleCompletion: (completionEligible??!(receipt.disposition === 'reused' && receipt.snapshot.state === 'done')) && observedDoneAttempt < receipt.snapshot.attempt,
  } : item) };
  const applied=applySnapshot(next,receipt.snapshot),current=applied.entries.find(item=>item.id===id)?.snapshot;
  return current?queueCompletion(applied,current):applied;
}
export function setEntryAcceptance(state: DockState, id: string, acceptance: DockEntry['acceptance'], errorCode?: string): DockState {
  return { ...state, entries: state.entries.map((item) => item.id === id ? { ...item, acceptance, errorCode } : item) };
}
export function setConnection(state: DockState, jobId: string, lost: boolean): DockState {
  return { ...state, entries: state.entries.map((item) => item.jobId === jobId ? { ...item, connectionLost: lost } : item) };
}
export function applySnapshot(state: DockState, incoming: Snapshot): DockState {
  if (!incoming || !Number.isSafeInteger(incoming.attempt) || incoming.attempt < 1 || !Number.isSafeInteger(incoming.state_version) || incoming.state_version < 0
    || !['created','fetching','parsing','geo','storing','done','failed'].includes(incoming.state) || !incoming.actions
    || incoming.state === 'done' && (!incoming.result || !incoming.stored_count)) throw new Error('INGEST_SNAPSHOT_INVALID');
  let applied = false;
  const entries = state.entries.map((item) => {
    if (item.jobId !== incoming.ingest_id || item.snapshot && (incoming.state_version <= item.snapshot.state_version || incoming.attempt < item.snapshot.attempt)) return item;
    applied = true; return { ...item, snapshot: incoming, connectionLost: false };
  });
  if (!applied) return state;
  return queueCompletion({...state,entries},incoming);
}
function queueCompletion(state:DockState,incoming:Snapshot):DockState {
  const key=`${incoming.ingest_id}:${incoming.attempt}`;
  const target=state.entries.find(item=>item.jobId===incoming.ingest_id&&item.eligibleCompletion);
  if(incoming.state!=='done'||!target||state.seen.includes(key))return state;
  const completion:Completion={key,jobId:incoming.ingest_id,entryId:target.id,snapshot:incoming,remainingMs:10000};
  return {...state,seen:[...state.seen,key],presenting:state.presenting??completion,completions:state.presenting?[...state.completions,completion]:state.completions};
}

export function setDockVisibility(state: DockState, visible: boolean): DockState { return state.visible === visible ? state : { ...state, visible }; }
export function elapseVisible(state: DockState, milliseconds: number): DockState {
  if (!state.visible || !state.presenting || !Number.isFinite(milliseconds) || milliseconds <= 0) return state;
  const left = state.presenting.remainingMs - milliseconds;
  if (left > 0) return { ...state, presenting: { ...state.presenting, remainingMs: left } };
  // An event-loop delay cannot consume the next result before it has actually been rendered.
  return { ...state, presenting: state.completions[0] ?? null, completions: state.completions.slice(1) };
}


/** Only an explicitly accepted resync may replace a different log generation. Preserve valid FIFO time. */
export function rebaseJobSnapshot(state:DockState,incoming:Snapshot,observedDoneAttempt:number):DockState {
 const jobId=incoming.ingest_id,key=`${jobId}:${incoming.attempt}`;
 const eligible=state.entries.some(entry=>entry.jobId===jobId&&entry.eligibleCompletion)&&observedDoneAttempt<incoming.attempt;
 const queue=[...(state.presenting?[state.presenting]:[]),...state.completions].flatMap(completion=>{
  if(completion.jobId!==jobId)return [completion];
  return incoming.state==='done'&&completion.key===key&&eligible?[{...completion,snapshot:incoming}]:[];
 });
 const retained=queue.some(completion=>completion.key===key);
 const seen=state.seen.filter(value=>!value.startsWith(`${jobId}:`)||Number(value.slice(jobId.length+1))<=observedDoneAttempt||retained&&value===key);
 return applySnapshot({...state,entries:state.entries.map(entry=>entry.jobId===jobId?{...entry,snapshot:undefined,eligibleCompletion:entry.eligibleCompletion&&observedDoneAttempt<incoming.attempt}:entry),seen,presenting:queue[0]??null,completions:queue.slice(1)},incoming);
}
