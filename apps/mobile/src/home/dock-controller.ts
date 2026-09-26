import { AuthApiError } from '../auth/api';
import { getAuthSnapshot, subscribeAuth } from '../auth/session-context';
import type { HomeApiClient, HomeInputParseResponse, IngestAcceptedResponse, IngestRetryRequest } from './api';
import { acceptEntry, addBatch, applySnapshot, rebaseJobSnapshot, removeDeletedJob, emptyDock, elapseVisible, setConnection, setDockVisibility, setEntryAcceptance, type DockState } from './dock-model';
import type { ClipboardResult } from './clipboard';
import { operationJournal, JournalError, type OperationJournal, type JournalOperation, type JournalScope, type StartPayload } from './operation-journal';
import {watchDurableJob} from './durable-watch';
import {parseIngestCursor} from './ingest-protocol';
import type {IngestCheckpoint} from './ingest-checkpoint-store';
import type { PendingInput } from './input-inbox';
import { inputTelemetry } from '../telemetry/input-events';

export type DockViewState = DockState & {
  notice: string | null; parsing: boolean; parsed: HomeInputParseResponse | null;
  busy: string[]; uncertainRetries: string[];
  pasting: boolean;
  restoring: boolean; journalError: boolean;
};
const empty = (): DockViewState => ({ ...emptyDock(), notice: null, parsing: false, parsed: null, busy: [], uncertainRetries: [], pasting: false, restoring: false, journalError: false });
type Retry = { jobId: string; request: IngestRetryRequest };
export type DockPresentationObservation = { kind: 'visible-start' | 'visible-pause' | 'visible-complete'; entryId: string; attempt: number; atMs: number };
const knownRejection = (error: unknown) => error instanceof AuthApiError && (
  [400, 404, 409, 413, 422, 429].includes(error.status ?? 0) || error.code === 'INGEST_CAPABILITY_UNAVAILABLE'
);

/** In-memory presentation scoped to one authenticated epoch; the server owns job and command facts. */
export class ImportDockController {
  private state = empty();
  private listeners = new Set<() => void>();
  private scope = getAuthSnapshot();
  private live = false;
  private invalidated = false;
  private unsubscribe?: () => void;
  private timer?: ReturnType<typeof setInterval>;
  private stopWatch?: () => void;
  private watchedId?: string;
  private watchToken?: symbol;
  private checkpoints=new Map<string,IngestCheckpoint>();
  private completedHeads=new Map<string,string>();
  private watchFailures=new Map<string,number>();
  private durableWatchAfter=new Map<string,number>();
  private retries = new Map<string, Retry>();
  private pendingReceipts = new Map<string, {jobId:string;disposition:IngestAcceptedResponse["disposition"];completionEligible:boolean}>();
  private watchOrder = new Map<string,number>();
  private watchSequence = 0;
  private shareTexts = new Map<string, string>();
  private pumping = false;
  private reconciling = false;
  private wantedVisible = false;
  private renderedKey?: string;
  private lastTick = 0;
  private nextRead = 0;
  private failures = 0;
  private watchAfter = 0;
  private inputRevision = 0;
  private records = new Map<string, JournalOperation>();
  private retiredJobs = new Set<string>();
  private restored = false;
  private restoreFlight?: Promise<void>;
  private refreshRequested = false;
  private externalInputs: Array<{ id: string; start: number; end: number; expiresAt: number }> = [];
  private parsedBindings?: { text: string; ids: string[] };

  constructor(readonly api: HomeApiClient, readonly journal: OperationJournal = operationJournal, private readonly observePresentation?: (event: DockPresentationObservation) => void) {}
  private observe(kind: DockPresentationObservation['kind'], entryId: string, attempt: number) {
    try { this.observePresentation?.({ kind, entryId, attempt, atMs: performance.now() }); } catch { /* Diagnostic collection never changes domain behavior. */ }
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(next: Partial<DockViewState> | DockState) {
    if (this.invalidated) return;
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }
  private runBackground(work: () => Promise<unknown>) {
    const activity = getAuthSnapshot().activity;
    const failed = () => {
      // Normal failures are handled in the domain method. This last boundary does
      // not invent a receipt, retry, or terminal result after an unexpected rejection.
      try { if (this.current(activity) && !this.state.notice) this.update({ notice: '状态暂时无法更新，请重新确认。' }); }
      catch { /* A failing view listener cannot create another unhandled rejection. */ }
    };
    try { work().catch(failed); } catch { failed(); }
  }
  private usable() { const now = getAuthSnapshot(); return this.live && !this.invalidated && now.epoch === this.scope.epoch && now.phase === 'authenticated'; }
  private current(activity: number) { return this.usable() && getAuthSnapshot().activity === activity; }
  private journalScope(activity = getAuthSnapshot().activity): JournalScope { return { ownerId: this.scope.identity?.ownerId ?? '', valid: () => this.current(activity) }; }
  private closeWatch() {
    const stop = this.stopWatch; this.stopWatch = undefined; this.watchedId = undefined; this.watchToken = undefined;
    try { stop?.(); } catch { /* Stream disposal cannot change an accepted command. */ }
  }
  activate() {
    if (this.live || this.invalidated) return;
    this.live = true;
    const sync = () => {
      const auth = getAuthSnapshot();
      if (auth.epoch !== this.scope.epoch) {
        this.deactivate(); this.retries.clear(); this.pendingReceipts.clear(); this.watchOrder.clear(); this.shareTexts.clear(); this.records.clear();this.retiredJobs.clear();this.checkpoints.clear();this.completedHeads.clear();this.watchFailures.clear();this.durableWatchAfter.clear(); this.externalInputs = []; this.parsedBindings = undefined; this.state = empty(); this.invalidated = true;
        for (const listener of this.listeners) listener(); return;
      }
      this.setVisible(this.wantedVisible);
      if (!this.usable()) this.closeWatch();
      else { this.nextRead = 0; this.runBackground(() => this.restore()); this.runBackground(() => this.pump()); if (this.state.visible) this.runBackground(() => this.reconcile()); }
    };
    this.unsubscribe = subscribeAuth(sync);
    this.timer = setInterval(() => this.tick(), 250); sync();
  }
  deactivate() {
    this.live = false; this.unsubscribe?.(); this.unsubscribe = undefined;
    clearInterval(this.timer); this.timer = undefined; this.closeWatch(); this.setVisible(false);
  }
  setVisible(visible: boolean) {
    this.wantedVisible = visible;
    const next = visible && this.usable(), changed = this.state.visible !== next;
    if (changed && !next && this.state.presenting && this.renderedKey === this.state.presenting.key) this.observe('visible-pause', this.state.presenting.entryId, this.state.presenting.snapshot.attempt);
    this.update(setDockVisibility(this.state, next));
    if (changed) { this.lastTick = performance.now(); this.renderedKey = undefined; }
    if (!this.state.visible) this.closeWatch();
    else { this.nextRead = 0; this.runBackground(() => this.reconcile()); }
  }
  acknowledgePresentation(key: string) {
    if (this.state.visible && this.state.presenting?.key === key && this.renderedKey !== key) {
      this.renderedKey = key; this.lastTick = performance.now();
      const completion = this.state.presenting, activity = getAuthSnapshot().activity;
      this.observe('visible-start', completion.entryId, completion.snapshot.attempt);
      inputTelemetry.capture(() => this.current(activity)).emitJob('ingest_presented', completion.jobId, completion.snapshot.attempt,
        { attempt: completion.snapshot.attempt, stored_count: completion.snapshot.stored_count });
    }
  }
  private tick() {
    const now = performance.now(), elapsed = now - this.lastTick; this.lastTick = now;
    if (!this.state.visible || !this.usable()) return;
    if (!this.restored && !this.state.journalError) this.runBackground(() => this.restore());
    if (this.renderedKey === this.state.presenting?.key && this.state.presenting) {
      const before = this.state.presenting; this.update(elapseVisible(this.state, elapsed));
      if (this.state.presenting?.key !== before.key) {
        this.observe('visible-complete', before.entryId, before.snapshot.attempt);
        for (const row of this.records.values()) if (row.jobId === before.jobId) row.observedDoneAttempt = Math.max(row.observedDoneAttempt ?? 0, before.snapshot.attempt);
        void this.journal.noteDone(this.journalScope(), before.jobId, before.snapshot.attempt).catch(() => { /* A replayed presentation is safer than inventing a new business action. */ });
      }
    }
    if (now >= this.nextRead) this.runBackground(() => this.reconcile());
  }
  setInput(input: string) {
    if (!this.usable()) return;
    const previous = this.state.input;
    this.externalInputs = this.externalInputs.flatMap((binding) => {
      const fragment = previous.slice(binding.start, binding.end);
      if (!fragment) return [];
      let position = input.indexOf(fragment);
      while (position >= 0) {
        const end = position + fragment.length;
        const startBoundary = position === 0 || /\s/.test(input[position - 1]) || /^\s/.test(fragment);
        const endBoundary = end === input.length || /\s/.test(input[end]) || /\s$/.test(fragment);
        if (startBoundary && endBoundary) return [{ ...binding, start: position, end }];
        position = input.indexOf(fragment, position + 1);
      }
      return [];
    });
    this.inputRevision++; this.update({ input });
  }
  adoptInput(item: PendingInput) {
    if (!this.usable() || item.ownerId !== this.scope.identity?.ownerId || item.expiresAt <= Date.now()) return;
    const text = [this.state.input, item.text].filter(Boolean).join('\n');
    if (text.length > 2000) return;
    const start = this.state.input.length + (this.state.input ? 1 : 0);
    this.setInput(text); this.externalInputs.push({ id: item.id, start, end: text.length, expiresAt: item.expiresAt });
  }
  private captureBindings() {
    const offset = this.state.input.length - this.state.input.trimStart().length;
    return this.externalInputs.filter((binding) => binding.expiresAt > Date.now()).map((binding) => ({ id: binding.id, start: binding.start - offset, end: binding.end - offset }));
  }
  async restore(force = false) {
    if (!this.usable()) return;
    if (this.restoreFlight) { if (force) this.refreshRequested = true; return this.restoreFlight; }
    if (this.restored && !force && !this.state.journalError) return;
    const activity = getAuthSnapshot().activity;
    this.update({ restoring: true, journalError: false });
    this.restoreFlight = (async () => {
      try {
        const rows = await this.journal.list(this.journalScope(activity));
        if (!this.current(activity)) return;
        const visibleRows = rows.filter((row) => !row.jobId || !this.retiredJobs.has(row.jobId));
        this.installRecords(visibleRows); this.restored = true;
        void this.restoreCheckpoints(visibleRows,activity).catch(()=>{if(this.current(activity))this.update({notice:'本机进度暂时无法读取，正在确认原任务。'});});
        // The local read is the preparation barrier. Network reconciliation proceeds independently.
        this.runBackground(() => this.reconcile());
      } catch { if (this.current(activity)) this.update({ journalError: true, notice: '暂时无法读取本机导入记录，输入仍保留。' }); }
      finally {
        this.restoreFlight = undefined; this.update({ restoring: false });
        if (this.refreshRequested && this.usable()) { this.refreshRequested = false; this.runBackground(() => this.restore(true)); }
      }
    })();
    return this.restoreFlight;
  }
  private installRecords(rows: JournalOperation[]) {
    const existingEntries = new Set(this.state.entries.map((entry) => entry.id));
    for (const row of rows) {
      const known = this.records.get(row.operationId);
      this.records.set(row.operationId, { ...row, phase: known?.phase === 'accepted' ? 'accepted' : row.phase, payload: known?.phase === 'accepted' ? null : row.payload,
        jobId: known?.jobId ?? row.jobId, observedDoneAttempt: Math.max(known?.observedDoneAttempt ?? 0, row.observedDoneAttempt ?? 0) });
    }
    const groups = new Map<string, JournalOperation[]>();
    for (const source of rows) { const row = this.records.get(source.operationId)!; const group = groups.get(row.entryId) ?? []; group.push(row); groups.set(row.entryId, group); }
    const bases = [...groups.values()].map((group) => group.find((row) => row.kind === 'start') ?? group[0]);
    for (const batchId of new Set(bases.map((row) => row.batchId))) {
      if (this.state.batches.some((batch) => batch.id === batchId)) continue;
      const batch = bases.filter((row) => row.batchId === batchId).sort((a, b) => a.position - b.position);
      this.update(addBatch(this.state, { id: batchId, entries: batch.map((row) => ({ id: row.entryId, url: '' })), unrecognized: [], duplicates: 0, restored: true }));
      this.update({ entries: this.state.entries.map((entry) => {
        const row = batch.find((value) => value.entryId === entry.id);
        return row ? { ...entry, acceptance: row.phase === 'rejected' ? 'rejected' as const : 'unknown' as const, position: row.position, total: row.total } : entry;
      }) });
    }
    for (const [entryId, group] of groups) {
      const retry = group.filter((row) => row.kind === 'retry' && row.phase !== 'rejected').sort((a, b) => b.createdAt - a.createdAt)[0];
      if (retry && (retry.phase === 'unconfirmed' || !existingEntries.has(entryId))) {
        if (!retry.retry) throw new JournalError('JOURNAL_CORRUPT');
        this.retries.set(entryId, { jobId: retry.retry.jobId, request: { operation_id: retry.operationId, expected_attempt: retry.retry.expectedAttempt, expected_state_version: retry.retry.expectedVersion } });
        this.update({ uncertainRetries: [...new Set([...this.state.uncertainRetries, entryId])] });
      }
    }
  }
  private async restoreCheckpoints(rows:JournalOperation[],activity:number){
    if(!this.api.getIngestRecovery||!this.api.watchDurableIngest)return;
    const accepted=rows.filter(row=>row.phase==='accepted'&&row.jobId&&row.disposition);
    for(const id of new Set(accepted.map(row=>row.jobId!))){
      if(!this.current(activity))return;
      const revision=this.checkpoints.get(id)?.revision;
      const saved=await this.journal.readCheckpoint(this.journalScope(activity),id);
      if(!this.current(activity))return;
      if(this.checkpoints.get(id)?.revision!==revision||!saved.value)continue;
      this.checkpoints.set(id,saved.value);
      const hint=this.state.entries.find(entry=>entry.jobId===id)?.snapshot?.head_cursor;
      if(hint&&parseIngestCursor(hint).streamId!==parseIngestCursor(saved.value.cursor).streamId)continue;
      const eligibleRows=accepted.filter(row=>row.jobId===id);
      const latest=[...new Set(eligibleRows.map(row=>row.entryId))].map(entryId=>eligibleRows.filter(row=>row.entryId===entryId).sort((a,b)=>(b.retry?.expectedAttempt??0)-(a.retry?.expectedAttempt??0)||b.createdAt-a.createdAt)[0]);
      for(const row of latest){
        const known=this.records.get(row.operationId)!;
        const observed=Math.max(saved.value.observedDoneAttempt,...[...this.records.values()].filter(record=>record.jobId===id).map(record=>record.observedDoneAttempt??0));
        this.update(acceptEntry(this.state,row.entryId,{disposition:known.disposition!,snapshot:saved.value.snapshot},observed,known.completionEligible));
      }
    }
    if(this.current(activity)&&this.state.visible)this.ensureWatch();
  }
  private applyCheckpoint(checkpoint:IngestCheckpoint,_resync:boolean){
    const id=checkpoint.snapshot.ingest_id,prior=this.checkpoints.get(id);
    this.checkpoints.set(id,checkpoint);
    const observed=Math.max(checkpoint.observedDoneAttempt,...[...this.records.values()].filter(row=>row.jobId===id).map(row=>row.observedDoneAttempt??0));
    for(const row of this.records.values())if(row.jobId===id)row.observedDoneAttempt=Math.max(row.observedDoneAttempt??0,observed);
    this.state={...this.state,entries:this.state.entries.map(entry=>{if(entry.jobId!==id)return entry;const accepted=[...this.records.values()].filter(row=>row.entryId===entry.id&&row.phase==='accepted').sort((a,b)=>(b.retry?.expectedAttempt??0)-(a.retry?.expectedAttempt??0)||b.createdAt-a.createdAt)[0];return {...entry,eligibleCompletion:(accepted?.completionEligible??entry.eligibleCompletion)&&observed<checkpoint.snapshot.attempt};})};
    const previousCursor=this.state.entries.find(entry=>entry.jobId===id)?.snapshot?.head_cursor??prior?.cursor;
    const changedNamespace=!!previousCursor&&parseIngestCursor(previousCursor).streamId!==parseIngestCursor(checkpoint.cursor).streamId;
    this.update(changedNamespace?rebaseJobSnapshot(this.state,checkpoint.snapshot,observed):applySnapshot(this.state,checkpoint.snapshot));
    this.update(setConnection(this.state,id,false));
  }
  async paste(read: () => Promise<ClipboardResult>) {
    if (!this.usable() || this.state.pasting) return;
    const activity = getAuthSnapshot().activity, revision = this.inputRevision;
    this.update({ pasting: true });
    try {
      const result = await read();
      if (!this.current(activity)) return;
      if (revision !== this.inputRevision) { this.update({ notice: '输入已变化，请再次选择粘贴。' }); return; }
      if (result.kind === 'text') {
        const input = [this.state.input, result.value].filter(Boolean).join('\n');
        if (input.length > 2000) { this.update({ notice: '内容较长，请先处理当前输入，再分段粘贴。' }); return; }
        this.setInput(input); this.update({ notice: '内容已放入输入框，确认后发送。' });
      } else this.update({ notice: result.kind === 'empty' ? '剪贴板中没有文字，可直接输入。' : result.kind === 'too-long' ? '剪贴板文字较长，请长按输入框分段粘贴。' : result.kind === 'non-text' ? '这里只接收文字，可长按粘贴链接或直接输入。' : '暂时无法读取剪贴板，可长按输入框粘贴或直接输入。' });
    } catch { if (this.current(activity)) this.update({ notice: '暂时无法读取剪贴板，可长按输入框粘贴或直接输入。' }); }
    finally { this.update({ pasting: false }); }
  }
  setExpanded(expanded: boolean) { this.update({ expanded }); }
  setNotice(notice: string | null) { this.update({ notice }); }
  async forgetDeletedJob(jobId: string): Promise<boolean> {
    if (!this.usable() || !/^ing_[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(jobId)) return false;
    const activity = getAuthSnapshot().activity;
    this.retiredJobs.add(jobId);
    if (this.watchedId === jobId) this.closeWatch();
    const removed = this.state.entries.filter((entry) => entry.jobId === jobId).map((entry) => entry.id);
    for (const [operationId, row] of this.records) if (row.jobId === jobId) this.records.delete(operationId);
    for (const [operationId, receipt] of this.pendingReceipts) if (receipt.jobId === jobId) this.pendingReceipts.delete(operationId);
    for (const id of removed) { this.retries.delete(id); this.shareTexts.delete(id); }
    this.checkpoints.delete(jobId); this.completedHeads.delete(jobId); this.watchFailures.delete(jobId);
    this.durableWatchAfter.delete(jobId); this.watchOrder.delete(jobId);
    this.update({ ...removeDeletedJob(this.state, jobId),
      busy: this.state.busy.filter((id) => !removed.includes(id)),
      uncertainRetries: this.state.uncertainRetries.filter((id) => !removed.includes(id)) });
    try { await this.journal.discardJob(this.journalScope(activity), jobId); return this.current(activity); }
    catch { if (this.current(activity)) this.update({ notice: '记录已删除，但本机旧进度暂时无法清理；请稍后重新打开应用确认。' }); return false; }
  }
  clearParsed() { this.parsedBindings = undefined; this.update({ parsed: null }); }
  async restoreEntry(id: string) {
    if (!this.usable()) return;
    const entry = this.state.entries.find((item) => item.id === id && item.acceptance === 'rejected');
    if (!entry) return;
    const activity = getAuthSnapshot().activity, revision = this.inputRevision;
    let text = this.shareTexts.get(id) ?? entry.url;
    try {
      if (!text) {
        const body = await this.journal.payload(this.journalScope(activity), id);
        if (!this.current(activity) || this.inputRevision !== revision) return;
        text = body && ('url' in body ? body.url : 'share_text' in body ? body.share_text : '') || '';
      }
      if (!text) { this.update({ notice: '原输入已过期，请重新输入。' }); return; }
      if (this.state.input.trim() === text.trim() || this.state.input.split('\n').some((line) => line.trim() === text.trim())) return;
      const input = [this.state.input, text].filter(Boolean).join('\n');
      if (input.length > 2000) { this.update({ notice: '请先处理输入框中的内容，再放回这条链接。' }); return; }
      this.setInput(input); this.update({ notice: '链接已放回输入框，确认后可重新发送。' });
    } catch { if (this.current(activity)) this.update({ notice: '暂时无法读取原输入，请稍后重试或手动输入。' }); }
  }
  async confirmUnknownLink(text: string) {
    if (!this.usable() || !text || this.state.parsing) return;
    const activity = getAuthSnapshot().activity, bindings = this.parsedBindings?.text === text.trim() ? [...this.parsedBindings.ids] : text.trim() === this.state.input.trim() ? this.captureBindings().map((binding) => binding.id) : [];
    this.update({ parsing: true });
    try {
      if (await this.prepareInputs([{ share_text: text }], activity, bindings)) {
        this.clearParsed();
        if (this.state.input === text) this.setInput('');
        this.runBackground(() => this.pump());
      }
    } catch { if (this.current(activity)) this.update({ notice: '暂时无法保存这次导入操作，内容仍保留，尚未发送。' }); }
    finally { this.update({ parsing: false }); }
  }
  private async prepareInputs(inputs: StartPayload[], activity: number, bindings: string[], unrecognized: Array<{ text: string; reason: string }> = [], duplicates = 0) {
    await this.restore();
    if (!this.current(activity)) return false;
    if (!this.restored) throw new JournalError('JOURNAL_UNAVAILABLE');
    if (this.activeCount() + inputs.length > 100) { this.update({ notice: '尚待处理或确认的链接较多，请稍后再添加。输入仍保留。' }); return false; }
    const prepared = await this.journal.prepare(this.journalScope(activity), inputs, bindings);
    if (!this.current(activity)) return false;
    if (!prepared.created) {
      this.installRecords(prepared.records);
      for (const row of prepared.records) { if (!this.current(activity)) return false; await this.recover(row.entryId, false, true); }
      this.update({ notice: '这份分享已有确认记录，已恢复原操作，当前输入仍保留。' });
      return false;
    }
    if (prepared.records.length !== inputs.length || prepared.records.some((row, index) => row.kind !== 'start' || row.position !== index + 1 || row.total !== inputs.length)) throw new JournalError('JOURNAL_CORRUPT');
    for (const row of prepared.records) this.records.set(row.operationId, row);
    this.update(addBatch(this.state, { id: prepared.records[0].batchId, entries: prepared.records.map((row, index) => {
      const body = inputs[index]; if ('share_text' in body) this.shareTexts.set(row.entryId, body.share_text);
      return { id: row.entryId, url: 'url' in body ? body.url : '' };
    }), unrecognized, duplicates }));
    return true;
  }

  private activeCount() { return this.state.entries.filter((entry) => entry.acceptance === 'pending' || entry.acceptance === 'unknown' && entry.errorCode !== 'INPUT_RECOVERY_EXPIRED' || entry.snapshot && !['done', 'failed'].includes(entry.snapshot.state)).length; }
  async submit() {
    const text = this.state.input.trim();
    if (!text || !this.usable() || this.state.parsing) return;
    const activity = getAuthSnapshot().activity, bindings = this.captureBindings();
    const telemetry = inputTelemetry.capture(() => this.current(activity));
    telemetry.emit('home_input_submit', {});
    this.parsedBindings = undefined;
    this.update({ parsing: true, notice: null, parsed: null });
    try {
      const result = await this.api.parseInput({ text });
      if (!this.current(activity)) return;
      const links = result.links ?? (result.url ? [{ url: result.url, position: 0 }] : []);
      telemetry.emit('home_input_classified', { classification: result.type === 'trip_params' ? 'trip_request' : result.type,
        ...(result.links || result.url ? { link_count: links.length } : {}), ...(result.unrecognized ? { unrecognized_count: result.unrecognized.length } : {}) });
      if (result.type === 'xhs_link' && links.length) {
        if (bindings.length && !result.link_occurrences) throw new JournalError('JOURNAL_CORRUPT');
        const contributing = bindings.filter((binding) => result.link_occurrences?.some((link) => Number.isSafeInteger(link.position) && link.position >= binding.start && link.position < binding.end)).map((binding) => binding.id);
        if (await this.prepareInputs(links.map(({ url, original_url }) => ({ url: original_url ?? url })), activity, contributing, result.unrecognized ?? [], result.duplicate_count ?? 0)) {
          if (this.state.input.trim() === text) this.setInput('');
          this.runBackground(() => this.pump());
        }
      } else { this.parsedBindings = { text: (result.original_text || text).trim(), ids: bindings.map((binding) => binding.id) }; this.update({ parsed: result }); }
    } catch (error) {
      if (this.current(activity)) {
        this.update({ notice: error instanceof JournalError ? error.code === 'INPUT_REPLAY_CONFLICT' ? '部分分享已有确认记录，请移除已确认的内容后重试。其余输入已保留。' : '暂时无法保存这次导入操作，内容仍保留，尚未发送。' : '输入暂时无法识别，内容已保留，请重试。' });
        if (error instanceof JournalError && error.code === 'INPUT_REPLAY_CONFLICT') this.runBackground(() => this.restore(true));
      }
    }
    finally { if (!this.invalidated) this.update({ parsing: false }); }
  }
  private async pump() {
    if (this.pumping || !this.usable() || !this.restored) return;
    this.pumping = true;
    try {
      for (;;) {
        const entry = this.state.entries.find((item) => item.acceptance === 'pending');
        if (!entry || !this.usable()) break;
        await this.send(entry.id);
      }
    } finally { this.pumping = false; }
  }
  private async accept(id: string, receipt: IngestAcceptedResponse, activity: number, telemetry?: ReturnType<typeof inputTelemetry.capture>) {
    const retry = this.retries.get(id);
    const knownJob = this.records.get(retry?.request.operation_id ?? id)?.jobId;
    if (!['created', 'reused', 'retried'].includes(receipt.disposition) || receipt.operation_id !== (retry?.request.operation_id ?? id) || !receipt.snapshot || receipt.ingest_id !== receipt.snapshot.ingest_id
      || retry && receipt.ingest_id !== retry.jobId || knownJob && receipt.ingest_id !== knownJob) throw new Error('INGEST_RECEIPT_INVALID');
    if (this.retiredJobs.has(receipt.ingest_id)) return;
    const operationId = retry?.request.operation_id ?? id;
    const pending = this.pendingReceipts.get(operationId) ?? {jobId:receipt.ingest_id,disposition:receipt.disposition,completionEligible:!(receipt.disposition==='reused'&&receipt.snapshot.state==='done')};
    this.pendingReceipts.set(operationId,pending);
    try {
      await this.journal.mark(this.journalScope(activity), operationId, 'accepted', pending.jobId,pending);
      if(this.current(activity)&&this.pendingReceipts.get(operationId)===pending)this.pendingReceipts.delete(operationId);
    } catch { /* Retry only the local receipt write; the original command is already accepted. */ }
    if (!this.current(activity)) throw new Error('AUTH_ACTIVITY_CHANGED');
    const record = this.records.get(operationId); if (record) { record.phase = 'accepted'; record.jobId = receipt.ingest_id;record.disposition??=pending.disposition;record.completionEligible??=pending.completionEligible; }
    const observed = Math.max(0, ...[...this.records.values()].filter((row) => row.entryId === id).map((row) => row.observedDoneAttempt ?? 0));
    const accepted = acceptEntry(this.state, id, receipt, observed, record?.completionEligible);
    // A created command certifies the initial attempt. Recovery GETs never backfill old collection.
    if (receipt.disposition === 'created') telemetry?.emitJob('ingest_job_created', receipt.ingest_id, 1, { disposition: 'created', attempt: 1 });
    this.update(accepted);
    this.retries.delete(id);
    this.update({ uncertainRetries: this.state.uncertainRetries.filter((item) => item !== id) });
    if (this.current(activity) && this.state.visible) this.ensureWatch();
  }
  private async send(id: string) {
    if (!this.usable() || this.state.busy.includes(id)) return;
    const entry = this.state.entries.find((item) => item.id === id); if (!entry) return;
    const activity = getAuthSnapshot().activity, retry = this.retries.get(id);
    const previouslyUnknown = entry.acceptance === 'unknown' || this.state.uncertainRetries.includes(id);
    this.update({ busy: [...this.state.busy, id] });
    try {
      const operationId = retry?.request.operation_id ?? id;
      if (!this.records.has(operationId)) throw new JournalError('JOURNAL_CORRUPT');
      let body: StartPayload | undefined;
      if (!retry) {
        if (entry.acceptance === 'pending' && (entry.url || this.shareTexts.has(id))) body = this.shareTexts.has(id) ? { share_text: this.shareTexts.get(id)! } : { url: entry.url };
        else {
          const stored = await this.journal.payload(this.journalScope(activity), operationId);
          if (!this.current(activity)) return;
          if (!stored || !('url' in stored || 'share_text' in stored)) { this.update(setEntryAcceptance(this.state, id, 'unknown', 'INPUT_RECOVERY_EXPIRED')); return; }
          body = stored;
        }
      }
      if (!this.current(activity)) return;
      const telemetry = inputTelemetry.capture(() => this.current(activity));
      const receipt = retry ? await this.api.retryIngest!(retry.jobId, retry.request) : await this.api.startIngest({ ...body!, operation_id: operationId });
      if (!this.current(activity)) throw new Error('AUTH_ACTIVITY_CHANGED');
      await this.accept(id, receipt as IngestAcceptedResponse, activity, telemetry);
    } catch (error) {
      if (this.invalidated) return;
      // A pre-admission rejection (e.g. 429) cannot settle a previous request whose result is unknown.
      const rejected = knownRejection(error) && (!previouslyUnknown || error instanceof AuthApiError && ['INGEST_STATE_CHANGED', 'INGEST_ATTEMPT_CHANGED'].includes(error.code ?? ''));
      if (rejected && this.current(activity)) {
        const operationId = retry?.request.operation_id ?? id;
        try { await this.journal.mark(this.journalScope(activity), operationId, 'rejected'); const row = this.records.get(operationId); if (row && row.phase !== 'accepted') row.phase = 'rejected'; } catch { /* Reconciliation remains tied to the original persisted identity. */ }
      }
      if (retry) {
        if (rejected && this.current(activity)) {
          this.retries.delete(id); this.update({ uncertainRetries: this.state.uncertainRetries.filter((item) => item !== id), notice: '当前状态不接受这次重试，正在重新确认。' });
          this.runBackground(() => this.reconcile());
        } else this.update({ uncertainRetries: [...new Set([...this.state.uncertainRetries, id])] });
      } else this.update(setEntryAcceptance(this.state, id, rejected && this.current(activity) ? 'rejected' : 'unknown', error instanceof AuthApiError ? error.code : undefined));
    } finally { this.update({ busy: this.state.busy.filter((item) => item !== id) }); }
  }
  async recover(id: string, resendIfAbsent = true, forceRead = false) {
    if (!this.usable() || this.state.busy.includes(id) || !this.api.getIngestCommand) return;
    const entry = this.state.entries.find((item) => item.id === id);
    if (!entry || !forceRead && entry.acceptance !== 'unknown' && !this.retries.has(id)) return;
    const activity = getAuthSnapshot().activity, operationId = this.retries.get(id)?.request.operation_id ?? id;
    this.update({ busy: [...this.state.busy, id] });
    let absent = false;
    try { const receipt = await this.api.getIngestCommand(operationId); if (this.current(activity)) await this.accept(id, receipt, activity); }
    catch (error) { absent = this.current(activity) && error instanceof AuthApiError && error.status === 404; }
    finally { this.update({ busy: this.state.busy.filter((item) => item !== id) }); }
    // This is an explicit user recovery. Reuse the same immutable request; never restart a batch.
    if (absent) {
      if (resendIfAbsent) await this.send(id);
      else if (this.current(activity)) {
        const row = this.records.get(operationId);
        this.update(setEntryAcceptance(this.state, id, 'unknown', row?.kind === 'start' && row.payloadExpiresAt <= Date.now() ? 'INPUT_RECOVERY_EXPIRED' : 'INGEST_COMMAND_NOT_FOUND'));
      }
    }
  }
  async retry(id: string) {
    if (!this.usable() || this.state.busy.includes(id) || !this.api.retryIngest || this.retries.has(id)) return;
    const entry = this.state.entries.find((item) => item.id === id), snapshot = entry?.snapshot;
    if (!entry?.jobId || !snapshot?.actions.retry || snapshot.state !== 'failed') return;
    const activity = getAuthSnapshot().activity;
    this.update({ busy: [...this.state.busy, id] });
    let created = false;
    try {
      const prepared = await this.journal.prepareRetry(this.journalScope(activity), id, { jobId: entry.jobId, expectedAttempt: snapshot.attempt, expectedVersion: snapshot.state_version });
      if (!this.current(activity)) return;
      const row = prepared.records[0]; if (!row?.retry) throw new JournalError('JOURNAL_CORRUPT');
      this.records.set(row.operationId, row);
      this.retries.set(id, { jobId: row.retry.jobId, request: { operation_id: row.operationId, expected_attempt: row.retry.expectedAttempt, expected_state_version: row.retry.expectedVersion } });
      created = prepared.created;
      if (!created) this.update({ uncertainRetries: [...new Set([...this.state.uncertainRetries, id])] });
    } catch { if (this.current(activity)) this.update({ notice: '暂时无法保存这次重试，尚未重新发送。' }); }
    finally { this.update({ busy: this.state.busy.filter((item) => item !== id) }); }
    if (!this.current(activity) || !this.retries.has(id)) return;
    if (created) await this.send(id); else await this.recover(id, false);
  }

  async reconcile() {
    if (this.reconciling || !this.usable() || !this.api.getIngestSnapshot || !this.restored) return;
    this.reconciling = true; const activity = getAuthSnapshot().activity;
    let failed = false;
    try {
      for(const [operationId,receipt] of this.pendingReceipts){
        if(!this.current(activity))return;
        try {
          await this.journal.mark(this.journalScope(activity),operationId,'accepted',receipt.jobId,receipt);
          if(this.current(activity)&&this.pendingReceipts.get(operationId)===receipt)this.pendingReceipts.delete(operationId);
        } catch { failed=true; }
      }
      for (const entry of this.state.entries) {
        if (!this.current(activity)) return;
        if (entry.acceptance === 'unknown' || this.state.uncertainRetries.includes(entry.id)) await this.recover(entry.id, false);
      }
      const jobs = [...new Set(this.state.entries.flatMap((entry) => entry.jobId && (entry.connectionLost || !['done'].includes(entry.snapshot?.state ?? '') || !!this.api.watchDurableIngest&&(!this.completedHeads.has(entry.jobId)||this.completedHeads.get(entry.jobId)!==entry.snapshot?.head_cursor)) ? [entry.jobId] : []))];
      for (const id of jobs) {
        if (!this.current(activity)) return;
        try {
          const snapshot = await this.api.getIngestSnapshot(id);
          if (!this.current(activity)) return;
          if (snapshot.ingest_id !== id) throw new Error('INGEST_SNAPSHOT_INVALID');
          this.update(applySnapshot(this.state, snapshot)); this.update(setConnection(this.state, id, false));
        } catch (error) {
          if (error instanceof AuthApiError && error.status === 404 && error.code === 'INGEST_JOB_NOT_FOUND')
            await this.forgetDeletedJob(id);
          else { if (this.current(activity)) this.update(setConnection(this.state, id, true)); failed = true; }
        }
      }
      if (this.current(activity) && this.state.visible) this.ensureWatch();
    } finally {
      this.reconciling = false; this.failures = failed ? Math.min(this.failures + 1, 4) : 0;
      this.nextRead = performance.now() + Math.min(30000, 5000 * 2 ** this.failures);
    }
  }
  private durableCandidates(){
    return this.state.entries.filter(item=>item.acceptance==='accepted'&&item.jobId&&item.snapshot&&!item.connectionLost&&performance.now()>=(this.durableWatchAfter.get(item.jobId)??0)&&(!this.completedHeads.has(item.jobId)||this.completedHeads.get(item.jobId)!==item.snapshot.head_cursor));
  }
  private ensureDurableWatch(){
    const candidates=this.durableCandidates();
    const entry=candidates.find(item=>item.jobId===this.watchedId)??candidates.sort((a,b)=>(this.watchOrder.get(a.jobId!)??0)-(this.watchOrder.get(b.jobId!)??0))[0];
    if(entry?.jobId===this.watchedId)return;
    this.closeWatch();if(!entry?.jobId)return;
    const id=entry.jobId,activity=getAuthSnapshot().activity,token=Symbol('durable-ingest-stream');
    this.watchedId=id;this.watchToken=token;this.watchOrder.set(id,++this.watchSequence);
    const valid=()=>this.watchToken===token&&this.current(activity)&&this.state.visible;
    const stop=watchDurableJob({jobId:id,scope:{ownerId:this.scope.identity!.ownerId,valid},journal:this.journal,api:this.api,
      shouldYield:()=>this.durableCandidates().some(item=>item.jobId!==id),
      onYield:()=>{if(!valid())return;this.closeWatch();queueMicrotask(()=>{if(this.current(activity)&&this.state.visible)this.ensureWatch();});},
      onCheckpoint:(checkpoint,resync)=>{if(!valid())return;const previous=this.checkpoints.get(id)?.cursor;this.applyCheckpoint(checkpoint,resync);if(previous!==checkpoint.cursor)this.watchFailures.delete(id);},
      onComplete:(checkpoint)=>{
        if(!valid())return;const repeated=this.completedHeads.get(id)===checkpoint.cursor;this.completedHeads.set(id,checkpoint.cursor);this.closeWatch();this.durableWatchAfter.set(id,performance.now()+(repeated?5000:0));this.nextRead=0;
        queueMicrotask(()=>{if(this.current(activity)&&this.state.visible)this.ensureWatch();});
      },
      onError:(reason)=>{
        if(!valid())return;this.closeWatch();const failures=Math.min(5,(this.watchFailures.get(id)??0)+1);this.watchFailures.set(id,failures);
        const after=performance.now()+(reason==='overflow'?500:Math.min(30000,500*2**failures));this.durableWatchAfter.set(id,after);this.nextRead=Math.min(this.nextRead,after);
        this.update(setConnection(this.state,id,true));
      },
    });
    if(valid())this.stopWatch=stop;else stop();
  }
  private ensureWatch() {
    if(!this.usable()||!this.state.visible){this.closeWatch();return;}
    if(this.api.getIngestRecovery&&this.api.watchDurableIngest){this.ensureDurableWatch();return;}
    const entry = this.state.entries.find((item) => item.jobId && item.snapshot && !['done', 'failed'].includes(item.snapshot.state) && !item.connectionLost);
    if (entry?.jobId === this.watchedId) return;
    this.closeWatch();
    if (!entry?.jobId || !this.api.watchIngest || performance.now() < this.watchAfter) return;
    const id = entry.jobId, activity = getAuthSnapshot().activity, token = Symbol('ingest-stream');
    this.watchedId = id; this.watchToken = token;
    const failed = () => {
      if (this.watchToken !== token) return;
      this.closeWatch(); this.watchAfter = performance.now() + 30000;
      if (this.current(activity)) this.update(setConnection(this.state, id, true));
    };
    try {
      const stop = this.api.watchIngest(id, (snapshot) => {
        if (this.watchToken !== token || !this.current(activity) || !this.state.visible || snapshot.ingest_id !== id) return false;
        this.update(applySnapshot(this.state, snapshot));
        const current = this.state.entries.find((item) => item.jobId === id)?.snapshot;
        if (current && ['done', 'failed'].includes(current.state)) this.closeWatch();
        return !!current && ['done', 'failed'].includes(current.state);
      }, failed);
      // A synchronous first frame/error may already have disposed this subscription.
      if (this.watchToken === token) this.stopWatch = stop;
      else { try { stop(); } catch { /* Already detached from business state. */ } }
    } catch { failed(); }
  }
}
