import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthSnapshot, useAuthSnapshot } from '../auth/session-context';
import { AsyncState, Button } from '../ui';
import { HomeSheet } from './HomeSheet';
import { writeClipboardText } from './clipboard';
import type { HomeApiClient, LibraryImportRecordDetail, LibraryImportRecordItem } from './api';

function statusLabel(status: LibraryImportRecordItem['status']) {
  if (status === 'done') return '已入库';
  if (status === 'failed') return '导入未完成';
  if (status === 'created') return '等待处理';
  return '处理中';
}

/** Read-only record view; retries remain in the durable Home import queue. */
export function ImportRecordsSection({ client }: { client: HomeApiClient }) {
  const auth = useAuthSnapshot();
  const scopeKey = `${auth.epoch}:${auth.activity}`;
  const listSerial = useRef(0), detailSerial = useRef(0);
  const listAbort = useRef<AbortController | null>(null), detailAbort = useRef<AbortController | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [items, setItems] = useState<LibraryImportRecordItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false), [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<LibraryImportRecordItem | null>(null);
  const [detail, setDetail] = useState<LibraryImportRecordDetail | null>(null);
  const [detailScope, setDetailScope] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false), [detailError, setDetailError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const cancelRequests = useCallback(() => {
    listSerial.current++; detailSerial.current++;
    listAbort.current?.abort(); detailAbort.current?.abort();
  }, []);

  const current = useCallback(() => {
    const now = getAuthSnapshot();
    return now.phase === 'authenticated' && `${now.epoch}:${now.activity}` === scopeKey;
  }, [scopeKey]);

  const loadPage = useCallback(async (cursor?: string) => {
    if (!client.getImportRecords || !current()) return;
    const serial = ++listSerial.current;
    listAbort.current?.abort();
    const controller = new AbortController(); listAbort.current = controller;
    if (cursor) setLoadingMore(true);
    else { setLoading(true); setItems([]); setNextCursor(null); }
    setError(null);
    try {
      const page = await client.getImportRecords({ limit: 20, ...(cursor ? { cursor } : {}) }, controller.signal);
      if (listSerial.current !== serial || !current()) return;
      setItems((before) => cursor ? [...new Map([...before, ...page.items].map((item) => [item.id, item])).values()] : page.items);
      setNextCursor(page.next_cursor);
      setLoadedScope(scopeKey);
    } catch {
      if (listSerial.current === serial && current()) { setError('导入记录暂时不可用，请重新获取'); setLoadedScope(scopeKey); }
    } finally {
      if (listSerial.current === serial && current()) { setLoading(false); setLoadingMore(false); }
    }
  }, [client, current, scopeKey]);

  useEffect(() => {
    cancelRequests();
    setItems([]); setNextCursor(null); setLoadedScope(null); setTarget(null); setDetail(null); setDetailScope(null);
    setError(null); setDetailError(null); setCopyNotice(null);
    if (auth.phase === 'authenticated') loadPage().catch(() => undefined);
    return () => { cancelRequests(); restoreFocus.current = null; };
  }, [auth.phase, cancelRequests, loadPage]);

  const openDetail = async (item: LibraryImportRecordItem, trigger: HTMLElement | null) => {
    if (!client.getImportRecordDetail || !current()) return;
    const serial = ++detailSerial.current;
    detailAbort.current?.abort();
    const controller = new AbortController(); detailAbort.current = controller;
    restoreFocus.current = trigger;
    setTarget(item); setDetail(null); setDetailScope(scopeKey); setDetailLoading(true); setDetailError(null); setCopyNotice(null);
    try {
      const result = await client.getImportRecordDetail(item.id, controller.signal);
      if (detailSerial.current === serial && current()) setDetail(result);
    } catch {
      if (detailSerial.current === serial && current()) setDetailError('记录详情暂时不可用，请重试');
    } finally {
      if (detailSerial.current === serial && current()) setDetailLoading(false);
    }
  };
  const closeDetail = () => {
    detailSerial.current++; detailAbort.current?.abort();
    setTarget(null); setDetail(null); setDetailScope(null); setDetailLoading(false); setDetailError(null); setCopyNotice(null);
  };
  const copyOriginal = async () => {
    if (!detail || !current()) return;
    const value = detail.original_url;
    const copied = await writeClipboardText(value);
    if (current()) setCopyNotice(copied ? '原链接已复制' : '复制失败，请检查剪贴板权限后重试');
  };

  const visible = loadedScope === scopeKey && auth.phase === 'authenticated' ? items : [];
  const visibleTarget = detailScope === scopeKey && auth.phase === 'authenticated' ? target : null;
  return <section className="import-records" aria-labelledby="import-records-title">
    <div className="import-records-heading">
      <div><h2 id="import-records-title">导入记录</h2><p>查看处理中、失败和已入库的来源。</p></div>
      <Button variant="quiet" onClick={() => { loadPage().catch(() => undefined); }}>刷新记录</Button>
    </div>
    {loading ? <AsyncState state="loading" message="正在读取导入记录" /> : null}
    {error ? <AsyncState state="error" message={error}><Button onClick={() => { loadPage().catch(() => undefined); }}>重试</Button></AsyncState> : null}
    {!loading && !error && visible.length === 0 ? <AsyncState state="empty" message="还没有导入记录" /> : null}
    {visible.length > 0 ? <div className="import-record-list">{visible.map((item) => <article className="inspiration-row" key={item.id}>
      <div>
        <h3>{item.title || '来源标题待确认'}</h3>
        <p>{item.poi_name ? `${item.poi_name}${item.poi_address ? ` · ${item.poi_address}` : ''}` : item.locate_status === 'pending' ? '地点待确认' : '暂无地点摘要'}</p>
        <span className="import-record-status">{statusLabel(item.status)}</span>
      </div>
      <div className="row-actions"><Button onClick={(event) => { openDetail(item, event.currentTarget).catch(() => undefined); }}
        aria-label={`查看${item.title || '未命名来源'}的导入记录`}>查看记录</Button></div>
    </article>)}</div> : null}
    {nextCursor && visible.length > 0 ? <Button variant="quiet" loading={loadingMore} onClick={() => { loadPage(nextCursor).catch(() => undefined); }}>加载更多记录</Button> : null}
    {visibleTarget ? <HomeSheet label="导入记录详情" onClose={closeDetail} restoreFocusTo={restoreFocus.current}>
      {detailLoading ? <AsyncState state="loading" message="正在读取记录详情" /> : null}
      {detailError ? <AsyncState state="error" message={detailError}><Button onClick={() => { openDetail(visibleTarget, restoreFocus.current).catch(() => undefined); }}>重试读取</Button></AsyncState> : null}
      {detail ? <div className="import-record-detail">
        <h2>{detail.title || '来源标题待确认'}</h2>
        <p>{statusLabel(detail.status)}{detail.poi_name ? ` · ${detail.poi_name}` : ''}{detail.locate_status === 'pending' ? ' · 地点待确认' : ''}</p>
        <p>原链接</p><p className="import-record-url">{detail.original_url}</p>
        <Button variant="primary" onClick={() => { copyOriginal().catch(() => undefined); }}>复制原链接</Button>
        {copyNotice ? <p role="status">{copyNotice}</p> : null}
        {detail.status === 'failed' ? <p>可在原导入队列中重试这条记录。</p> : null}
      </div> : null}
    </HomeSheet> : null}
  </section>;
}
