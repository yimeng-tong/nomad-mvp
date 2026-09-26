import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { getAuthSnapshot, useAuthSnapshot } from '../auth/session-context';
import type { Completion, DockEntry, Snapshot } from './dock-model';
import type { ImportDockController } from './dock-controller';
import { readClipboardText } from './clipboard';
import { inputInbox } from './input-runtime';
import { observeVisibleContent } from '../telemetry/visible-content';

const stages: Record<Snapshot['state'], string> = {
  created: '等待获取内容', fetching: '获取内容', parsing: '理解图文', geo: '验证地点', storing: '保存灵感', done: '灵感已保存', failed: '这条导入未完成',
};
function status(entry: DockEntry) {
  if (entry.acceptance === 'pending') return '正在确认受理';
  if (entry.acceptance === 'unknown') return '受理结果尚未确认';
  if (entry.acceptance === 'rejected') return entry.errorCode === 'INGEST_CAPABILITY_UNAVAILABLE' ? '导入服务暂时不可用，尚未受理' : '尚未受理，请检查后重新提交';
  return entry.snapshot ? stages[entry.snapshot.state] : '正在确认状态';
}
function safeTitle(value: string | null | undefined) { return value?.replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, '').slice(0, 120) || '分享内容'; }
export function dockAnnouncement(entry: DockEntry | undefined, completion: Completion | null, batchNumber: number) {
  return entry ? `第${batchNumber}批，${safeTitle(completion?.snapshot.source_title ?? entry.snapshot?.source_title)}，批次内第${entry.position}条，共${entry.total}条，${completion ? '灵感已保存，可查看结果' : status(entry)}` : '';
}
function failureReason(code: string | null | undefined) {
  const reasons: Record<string, string> = {
    INGEST_FETCH_FAILED: '这次未能获取分享内容。', INGEST_EXTRACTION_DEGRADED: '图文理解暂时未能完成。',
    INGEST_GEO_DEGRADED: '地点验证暂时未能完成。', INGEST_REHOST_DEGRADED: '部分素材暂时未能保存。',
    INGEST_CONTENT_UNAVAILABLE: '没有取得可用的内容。', INGEST_XHS_URL_REQUIRED: '分享链接无法识别。', INGEST_NOT_SAVED: '这次未能保存内容。',
    INGEST_PIPELINE_FAILED: '处理过程中发生错误。', INGEST_CAPABILITY_UNAVAILABLE: '导入服务暂时不可用。',
  };
  return code && reasons[code] || '这次处理未能完成，暂时没有更具体的原因。';
}

export function HomeImportDock({ controller, selectedCount, onPlan, onView, notice, onHeight, onRecognizedPlan, active = true }: {
  controller: ImportDockController; selectedCount: number; onPlan: () => void; onView: (id: string) => void;
  notice?: string | null; onHeight?: (height: number) => void; active?: boolean; onRecognizedPlan?: () => void;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const inbox = useSyncExternalStore(inputInbox.subscribe, inputInbox.getSnapshot);
  const auth = useAuthSnapshot();
  const runAction = useCallback((operation: () => Promise<void>) => {
    const scope = getAuthSnapshot();
    operation().catch(() => {
      const current = getAuthSnapshot();
      if (current.phase === 'authenticated' && current.epoch === scope.epoch && current.activity === scope.activity) controller.setNotice('操作暂时不可用，请稍后重试');
    });
  }, [controller]);
  const pendingInput = inbox.pending.find((item) => item.ownerId === null || item.ownerId === auth.identity?.ownerId);
  const ref = useRef<HTMLElement>(null), input = useRef<HTMLTextAreaElement>(null), completionRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => { if (auth.phase === 'authenticated' && inbox.recoverySignal) runAction(() => controller.restore(true)); }, [controller, auth.phase, inbox.recoverySignal, runAction]);
  useEffect(() => {
    const visible = () => controller.setVisible(active && auth.phase === 'authenticated' && document.visibilityState !== 'hidden');
    visible(); document.addEventListener('visibilitychange', visible);
    return () => { document.removeEventListener('visibilitychange', visible); controller.setVisible(false); };
  }, [controller, auth.phase, auth.activity, active]);
  const presentationKey = state.presenting?.key;
  useLayoutEffect(() => {
    if (!presentationKey || !state.visible || !completionRef.current) return;
    return observeVisibleContent(completionRef.current, () => controller.acknowledgePresentation(presentationKey), { persistent: true });
  }, [controller, presentationKey, state.visible]);
  useLayoutEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => onHeight?.(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height));
    observer.observe(ref.current); return () => observer.disconnect();
  }, [onHeight]);
  const current = state.entries.find((entry) => entry.id === state.presenting?.entryId)
    ?? state.entries.find((entry) => entry.acceptance !== 'accepted' || entry.snapshot?.state !== 'done') ?? state.entries.at(-1);
  const completion = state.presenting;
  const live = dockAnnouncement(current, completion, state.batches.findIndex((batch) => batch.id === current?.batchId) + 1);
  return <footer ref={ref} className={`home-import-dock ${state.expanded ? 'is-expanded' : 'is-compact'}`} aria-label="导入与旅行输入" data-presentation-visible={state.visible}>
    {state.expanded ? <div className="dock-drag-target" aria-hidden="true"
      onPointerDown={(event) => { if (event.button !== 0) return; drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }}
      onPointerUp={(event) => { const start = drag.current; drag.current = null; if (start && event.clientY - start.y >= 32 && Math.abs(event.clientX - start.x) < 48) controller.setExpanded(false); }}>
      <div className="dock-handle" />
    </div> : null}
    <div className="dock-heading">
      <strong>{completion ? '灵感已保存' : current ? status(current) : '从一个想法开始'}</strong>
      <button type="button" aria-label={state.expanded ? '收起队列' : '展开队列'} aria-expanded={state.expanded} aria-controls="home-import-queue"
        onClick={() => controller.setExpanded(!state.expanded)}><span aria-hidden="true">{state.expanded ? '⌄' : '⌃'}</span></button>
    </div>
    <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{live}</span>
    {completion ? <div ref={completionRef} className="dock-completion">
      <span className="dock-title">{safeTitle(completion.snapshot.source_title)}</span>
      {current ? <span>{current.position}/{current.total}</span> : null}
      <span>{completion.snapshot.result?.city_name || '已存入灵感库'}</span>
      <button type="button" data-home-sheet-trigger onClick={() => onView(completion.jobId)}>查看</button>
    </div> : !state.expanded && current ? <div className="dock-compact-item"><span className="dock-title">{safeTitle(current.snapshot?.source_title)}</span><span>{current.position}/{current.total}</span></div> : null}
    <div id="home-import-queue" className="dock-queue" hidden={!state.expanded}>
      {state.batches.map((batch) => {
        const entries = state.entries.filter((entry) => entry.batchId === batch.id);
        const accepted = entries.filter((entry) => entry.acceptance === 'accepted').length;
        const reused = entries.filter((entry) => entry.disposition === 'reused').length;
        return <section key={batch.id} aria-label={`导入批次 ${state.batches.indexOf(batch) + 1}`}>
          <p className="dock-batch-note">{batch.restored ? `已恢复${entries.length}条记录，已确认受理${accepted}条` : `已添加${accepted}个链接${batch.unrecognized.length ? '，部分内容未识别' : ''}`}</p>
          {batch.unrecognized.length || batch.duplicates || reused ? <details><summary>批次详情</summary>
            {batch.duplicates ? <p>本批重复链接已合并 {batch.duplicates} 个</p> : null}
            {reused ? <p>{reused} 个链接沿用已有任务或结果</p> : null}
            {batch.unrecognized.map((item, i) => <p key={i}>{safeTitle(item.text)}：{item.reason === 'unsupported_url' ? '暂不支持此来源' : '未识别为受支持链接'}</p>)}
          </details> : null}
          <ol className="dock-items">{entries.map((entry) => <li key={entry.id}>
            <div className="dock-item-title"><span className="dock-title">{safeTitle(entry.snapshot?.source_title)}</span><span>{entry.position}/{entry.total}</span></div>
            <div className="dock-item-facts"><span>{status(entry)}</span>
              {entry.connectionLost ? <span>连接中断，保留上次状态</span> : null}
              {entry.errorCode === 'INPUT_RECOVERY_EXPIRED' ? <span>原请求内容已过期，请重新输入</span> : null}
              {entry.snapshot?.partial && entry.snapshot.result ? <span>部分内容已保存</span> : null}
              {entry.snapshot?.stored_count != null ? <span>已保存 {entry.snapshot.stored_count} 项</span> : null}
              {entry.snapshot?.fetched_count != null ? <span>已获取 {entry.snapshot.fetched_count} 张图片</span> : null}
            </div>
            <div className="dock-item-actions">
              {entry.acceptance === 'rejected' ? <button type="button" onClick={() => { runAction(() => controller.restoreEntry(entry.id)); input.current?.focus(); }}>放回输入框</button> : null}
              {entry.acceptance === 'unknown' || state.uncertainRetries.includes(entry.id) ? <button type="button" disabled={state.busy.includes(entry.id)} onClick={() => runAction(() => controller.recover(entry.id))}>确认{state.uncertainRetries.includes(entry.id) ? '重试' : '受理'}结果</button>
                : entry.snapshot?.actions.retry ? <button type="button" disabled={state.busy.includes(entry.id)} onClick={() => runAction(() => controller.retry(entry.id))}>重试这条导入</button> : null}
              {entry.connectionLost ? <button type="button" onClick={() => runAction(() => controller.reconcile())}>重新确认状态</button> : null}
              {entry.jobId && entry.snapshot?.actions.view && entry.snapshot.result ? <button type="button" data-home-sheet-trigger onClick={() => onView(entry.jobId!)}>查看已保存内容</button> : null}
              {entry.snapshot?.state === 'failed' ? <details><summary>导入说明</summary><p>{failureReason(entry.snapshot.error_code)}{entry.snapshot.retriable ? '可以重试。' : '当前无法重试。'}{entry.snapshot.partial ? '已保存内容仍可查看。' : '尚无已确认保存的内容。'}</p></details> : null}
            </div>
          </li>)}</ol>
        </section>;
      })}
    </div>
    {state.restoring ? <p className="dock-notice" role="status">正在读取本机导入记录</p> : null}
    {state.journalError ? <button type="button" onClick={() => runAction(() => controller.restore(true))}>重新读取记录</button> : null}
    {state.parsed?.type === 'trip_params' ? <section className="home-recognized" aria-label="识别的旅行信息">
      <p>识别 {state.parsed.trip_params?.city} {state.parsed.trip_params?.days ? `${state.parsed.trip_params.days}天` : ''} {state.parsed.trip_params?.start_date ? `${state.parsed.trip_params.start_date}出发` : ''}</p>
      <button type="button" onClick={onRecognizedPlan}>继续规划</button>
    </section> : null}
    {pendingInput ? <section className="dock-incoming" aria-label="收到的分享内容"><p>收到分享内容，可放入输入框确认。</p>
      <button type="button" onClick={() => {
        const current = getAuthSnapshot(), draft = controller.getSnapshot().input;
        if (current.phase !== 'authenticated') return;
        const next = [draft, pendingInput.text].filter(Boolean).join('\n');
        if (next.length > 2000) { controller.setNotice('请先处理当前输入，再放入分享内容。'); return; }
        const item = inputInbox.take(pendingInput.id, current.identity?.ownerId ?? null);
        if (item) { controller.adoptInput(item); input.current?.focus(); }
      }}>放入输入框</button>
      <button type="button" onClick={() => inputInbox.dismiss(pendingInput.id)}>忽略</button>
    </section> : null}
    {notice || state.notice || inbox.notice ? <p className="dock-notice" role="status">{state.notice || inbox.notice || notice}</p> : null}
    <div className="dock-composer">
      <textarea ref={input} aria-label="统一输入" value={state.input} maxLength={2000} rows={state.expanded ? 3 : 2}
        onChange={(event) => { inputInbox.clearNotice(); controller.setInput(event.target.value); }} placeholder="粘贴分享链接或输入想去的地点，如：厦门 3天" />
      <button className="dock-send" type="button" data-home-sheet-trigger aria-label={state.input.trim() ? '发送' : '添加'} disabled={state.parsing}
        onClick={() => { inputInbox.clearNotice(); if (state.input.trim()) runAction(() => controller.submit()); else { input.current?.focus(); controller.setNotice('可长按输入框粘贴，或直接输入旅行想法。'); } }}>
        <span className={`dock-send-glyph ${state.input.trim() ? 'has-input' : ''}`} aria-hidden="true">{state.input.trim() ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M21 3 3 10l7 4 4 7 7-18Z" /><path d="m10 14 11-11" /></svg> : '+'}</span>
      </button>
    </div>
    <div className="basket-bar"><span>已选 {selectedCount}</span>
      <button type="button" aria-label="从剪贴板粘贴" disabled={state.pasting} onClick={() => { inputInbox.clearNotice(); input.current?.focus(); runAction(() => controller.paste(readClipboardText)); }}>{state.pasting ? '正在读取' : '粘贴'}</button>
      <button type="button" disabled={!selectedCount} onClick={onPlan}>开始规划</button></div>
  </footer>;
}
