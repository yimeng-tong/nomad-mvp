import { registerHostBackHandler } from '../platform/host';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Analytics } from '../auth/analytics';
import { createNoopAnalytics, trackAnalytics } from '../auth/analytics';
import type {
  HomeApiClient,
  LibraryCandidate,
  LibraryCitySummary,
  LibraryInspirationItem,
  PlannerHandoff,
  PlannerHandoffSelectedItem,
} from './api';
import { createHomeApiClient } from './api';
import { HomeImportDock } from './HomeImportDock';
import { HomeSheet } from './HomeSheet';
import { ImportDockController } from './dock-controller';
import { getAuthSnapshot } from '../auth/session-context';
import { inferPlannerTimeHint } from '../planner/timeHints';

type Segment = 'plan' | 'library';
type LibraryFilter = { kind: 'all' } | { kind: 'city'; city: LibraryCitySummary } | { kind: 'pending' };

export type HomeScreenProps = {
  apiClient?: HomeApiClient;
  dockController?: ImportDockController;
  analytics?: Analytics;
  onPlannerHandoff?: (handoff: PlannerHandoff) => void;
  onOpenSettings?: () => void;
};

function titleFor(item: LibraryInspirationItem) {
  return item.title || item.poi_name || item.summary || '未命名灵感';
}

function summaryFor(item: LibraryInspirationItem) {
  return item.summary || item.poi_address || item.city_name || '暂无摘要';
}

function selectedAnchor(item: LibraryInspirationItem): PlannerHandoffSelectedItem {
  return {
    item_id: item.id,
    poi_id: item.poi_id || undefined,
    source: 'library',
    time_hint: inferPlannerTimeHint(`${item.title || ''} ${item.summary || ''} ${item.poi_name || ''}`),
  };
}

function routeForCard(city: LibraryCitySummary) {
  const search = new URLSearchParams({ city: city.name, source: 'home_card', rec_id: city.city_id });
  return `/planner/pick?${search.toString()}`;
}

function routeForSelection(items: LibraryInspirationItem[]) {
  const search = new URLSearchParams({ source: 'home_input' });
  const cityNames = Array.from(new Set(items.map((item) => item.city_name).filter((cityName): cityName is string => Boolean(cityName))));
  if (cityNames.length === 1) search.set('city', cityNames[0]);
  return `/planner/pick?${search.toString()}`;
}

function filtersForLibrary(filter: LibraryFilter) {
  if (filter.kind === 'city') return { cityId: filter.city.city_id };
  if (filter.kind === 'pending') return { locateStatus: 'pending' as const };
  return undefined;
}

export function HomeScreen({ apiClient, dockController, analytics, onPlannerHandoff, onOpenSettings }: HomeScreenProps) {
  const client = useMemo(() => apiClient ?? createHomeApiClient(), [apiClient]);
  const controller = useMemo(() => dockController ?? new ImportDockController(client), [dockController, client]);
  const dock = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => { if (!dockController) controller.activate(); return () => { if (!dockController) controller.deactivate(); }; }, [controller, dockController]);
  const shell = useRef<HTMLElement>(null);
  const sheetReturnFocus = useRef<HTMLElement | null>(null);
  const setDockHeight = useCallback((height: number) => shell.current?.style.setProperty('--dock-height', `${height}px`), []);
  const activeResult = useRef<symbol | null>(null);
  const [result, setResult] = useState<LibraryInspirationItem | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const tracker = useMemo(() => analytics ?? createNoopAnalytics(), [analytics]);
  const activeCandidateId = useRef<symbol | null>(null);
  const [segment, setSegment] = useState<Segment>('plan');
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>({ kind: 'all' });
  const [cities, setCities] = useState<LibraryCitySummary[]>([]);
  const [unlocatedCount, setUnlocatedCount] = useState(0);
  const [inspirations, setInspirations] = useState<LibraryInspirationItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const unknownInput = dock.parsed?.type === 'unknown' ? dock.parsed.original_text : null;
  const [candidateTarget, setCandidateTarget] = useState<LibraryInspirationItem | null>(null);
  const [candidates, setCandidates] = useState<LibraryCandidate[]>([]);
  const [selectedItems, setSelectedItems] = useState<LibraryInspirationItem[]>([]);
  const runAction = useCallback((operation: () => Promise<void>) => {
    const scope = getAuthSnapshot();
    operation().catch(() => {
      const current = getAuthSnapshot();
      if (current.phase === 'authenticated' && current.epoch === scope.epoch && current.activity === scope.activity) setNotice('操作暂时不可用，请稍后重试');
    });
  }, []);



  const track = useCallback(
    (event: Parameters<Analytics['track']>[0], props?: Parameters<Analytics['track']>[1]) => {
      try {
        trackAnalytics(tracker, event, props);
      } catch {
        // Analytics must never block Home.
      }
    },
    [tracker],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cityResponse, inspirationResponse] = await Promise.all([client.getCities(), client.getInspirations(filtersForLibrary(libraryFilter))]);
      setCities(cityResponse.cities);
      setUnlocatedCount(cityResponse.unlocated_count);
      setInspirations(inspirationResponse.items);
      setNotice(null);
    } catch {
      setNotice('灵感库暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [client, libraryFilter]);

  useEffect(() => {
    track('home_view', { source_page: 'home' });
  }, [track]);

  useEffect(() => {
    runAction(refresh);
  }, [refresh, track, runAction]);

  const selectedIds = useMemo(() => selectedItems.map((item) => item.id), [selectedItems]);
  const resolvedItems = useMemo(() => inspirations.filter((item) => item.locate_status !== 'pending'), [inspirations]);
  const pendingItems = useMemo(() => inspirations.filter((item) => item.locate_status === 'pending'), [inspirations]);

  const switchSegment = (next: Segment) => {
    setSegment(next);
    track('home_segment_tap', { segment: next });
  };

  const toggleSelected = (item: LibraryInspirationItem) => {
    const willSelect = !selectedIds.includes(item.id);
    setSelectedItems((current) => (current.some((selected) => selected.id === item.id) ? current.filter((selected) => selected.id !== item.id) : [...current, item]));
    track('library_select', { item_id: item.id, locate_status: item.locate_status, selected: willSelect });
  };

  const selectLibraryFilter = (next: LibraryFilter) => {
    setLibraryFilter(next);
    track('library_city_tap', {
      city_id: next.kind === 'city' ? next.city.city_id : next.kind,
      count: next.kind === 'city' ? next.city.inspiration_count : next.kind === 'pending' ? unlocatedCount : inspirations.length,
    });
  };

  const openCandidates = async (item: LibraryInspirationItem) => {
    if (item.locate_status !== 'pending' || item.candidate_count < 1) return;
    const request = Symbol('candidate'); activeCandidateId.current = request;
    setCandidateTarget(item);
    setCandidates([]);
    track('library_candidate_open', { item_id: item.id, candidate_count: item.candidate_count });
    try {
      const response = await client.getCandidates(item.id);
      if (activeCandidateId.current === request) setCandidates(response.candidates);
    } catch {
      if (activeCandidateId.current === request) setNotice('定位候选暂时不可用');
    }
  };

  const closeCandidates = () => {
    activeCandidateId.current = null;
    setCandidateTarget(null);
    setCandidates([]);
  };

  const emitPlannerHandoff = (handoff: PlannerHandoff, sourceItems = selectedItems) => {
    const selected_items = sourceItems.map(selectedAnchor);
    const next = { ...handoff, selected_items };
    track('planner_handoff', { source: next.source, selected_count: selected_items.length });
    onPlannerHandoff?.(next);
    setNotice('已准备进入灵感选择页');
  };

  const startFromCity = (city: LibraryCitySummary) => {
    track('library_city_tap', { city_id: city.city_id, count: city.inspiration_count });
    const citySelectedItems = selectedItems.filter((item) => item.city_id === city.city_id);
    emitPlannerHandoff({
      route: routeForCard(city),
      source: 'home_card',
      selected_items: [],
    }, citySelectedItems);
  };

  const startWithSelection = () => {
    if (selectedItems.length === 0) return;
    emitPlannerHandoff({
      route: routeForSelection(selectedItems),
      source: 'home_input',
      selected_items: [],
    });
  };

  const closeResult = () => { activeResult.current = null; setResult(null); setResultLoading(false); };
  const viewResult = async (id: string) => {
    if (!client.getIngestResult) { setNotice('当前无法读取已保存内容，请稍后重试'); return; }
    const auth = getAuthSnapshot(), request = Symbol('result'); activeResult.current = request; setResult(null); setResultLoading(true);
    try {
      const item = await client.getIngestResult(id);
      if (activeResult.current === request && getAuthSnapshot().activity === auth.activity && getAuthSnapshot().epoch === auth.epoch) setResult(item);
    } catch { if (activeResult.current === request) { setNotice('已保存内容暂时无法读取，请重试'); closeResult(); } }
    finally { if (activeResult.current === request) setResultLoading(false); }
  };
  const closeUnknown = useCallback(() => controller.clearParsed(), [controller]);
  const handleUnknownAsLink = () => { if (unknownInput) runAction(() => controller.confirmUnknownLink(unknownInput)); };
  const handleUnknownAsPlan = () => {
    if (!unknownInput) return;
    closeUnknown();
    emitPlannerHandoff({ route: routeForSelection(selectedItems), source: 'home_input', selected_items: [] });
  };
  const continueRecognized = () => {
    const parsed = controller.getSnapshot().parsed;
    if (parsed?.type !== 'trip_params' || !parsed.planner_handoff) return;
    controller.clearParsed(); emitPlannerHandoff(parsed.planner_handoff);
  };
  useEffect(() => registerHostBackHandler(() => {
    if (result || resultLoading) { closeResult(); return true; }
    if (candidateTarget) { closeCandidates(); return true; }
    if (unknownInput) { closeUnknown(); return true; }
    return false;
  }, 20), [result, resultLoading, candidateTarget, unknownInput, controller, closeUnknown]);
  useEffect(() => () => { activeCandidateId.current = null; activeResult.current = null; }, []);

  return (
    <main ref={shell} className="home-shell" aria-labelledby="home-title" onClickCapture={(event) => {
      // Capture the activated Dock control before submit disables it. Pointer activation
      // need not focus a button, and later focus during parsing must not replace it.
      const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-home-sheet-trigger]') : null;
      if (trigger) sheetReturnFocus.current = trigger;
    }}>
      <div className="home-body" inert={!!(unknownInput || candidateTarget || result || resultLoading)}>
      <header className="home-header">
        <button className="icon-button" type="button" aria-label="菜单" onClick={onOpenSettings}>
          ☰
        </button>
        <div className="segment-control" aria-label="首页模式">
          <button type="button" aria-pressed={segment === 'plan'} onClick={() => switchSegment('plan')}>
            计划
          </button>
          <button type="button" aria-pressed={segment === 'library'} onClick={() => switchSegment('library')}>
            灵感
          </button>
        </div>
      </header>

      <section className="home-content">
        <div>
          <p className="brand-kicker">Nomad</p>
          <h1 id="home-title">把收藏变成下一段行程</h1>
        </div>

        {loading ? <p className="status-text">正在加载灵感</p> : null}

        <section aria-label="目的地卡片" className="destination-strip">
          {cities.length === 0 && !loading ? <p className="empty-state">还没有城市灵感，先粘贴一条小红书链接。</p> : null}
          {cities.map((city) => (
            <button
              className="destination-card"
              key={city.city_id}
              type="button"
              aria-label={`${city.name} ${city.inspiration_count} 个想去`}
              onClick={() => startFromCity(city)}
            >
              <strong>{city.name}</strong>
              <span>{city.inspiration_count} 个想去</span>
            </button>
          ))}
        </section>

        {segment === 'library' ? (
          <section className="library-panel" aria-label="灵感库">
            <div className="city-chip-row">
              <button type="button" aria-pressed={libraryFilter.kind === 'all'} onClick={() => selectLibraryFilter({ kind: 'all' })}>
                全部 {cities.reduce((total, city) => total + city.inspiration_count, 0) + unlocatedCount}
              </button>
              {cities.map((city) => (
                <button
                  key={city.city_id}
                  type="button"
                  aria-pressed={libraryFilter.kind === 'city' && libraryFilter.city.city_id === city.city_id}
                  onClick={() => selectLibraryFilter({ kind: 'city', city })}
                >
                  {city.name} {city.inspiration_count}
                </button>
              ))}
              {unlocatedCount > 0 ? (
                <button type="button" aria-pressed={libraryFilter.kind === 'pending'} onClick={() => selectLibraryFilter({ kind: 'pending' })}>
                  待定位 {unlocatedCount}
                </button>
              ) : null}
            </div>

            <div className="library-list">
              {inspirations.length === 0 && !loading ? <p className="empty-state">这个筛选下暂时没有灵感。</p> : null}

              {resolvedItems.length > 0 ? (
                <section className="library-section" aria-labelledby="library-resolved-title">
                  <h2 id="library-resolved-title">已入库</h2>
                  {resolvedItems.map((item) => {
                    const selected = selectedIds.includes(item.id);
                    return (
                      <article className="inspiration-row" key={item.id}>
                        <div>
                          <h3>{titleFor(item)}</h3>
                          <p>{summaryFor(item)}</p>
                          <span>{item.city_name || '已入库'}</span>
                        </div>
                        <div className="row-actions">
                          <button type="button" aria-pressed={selected} onClick={() => toggleSelected(item)}>
                            {selected ? '取消' : '选择'} {titleFor(item)}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              ) : null}

              {pendingItems.length > 0 ? (
                <section className="library-section" aria-labelledby="library-pending-title">
                  <h2 id="library-pending-title">待定位</h2>
                  {pendingItems.map((item) => {
                    const selected = selectedIds.includes(item.id);
                    return (
                      <article className="inspiration-row" key={item.id}>
                        <div>
                          <h3>{titleFor(item)}</h3>
                          <p>{summaryFor(item)}</p>
                          <span>待定位</span>
                        </div>
                        <div className="row-actions">
                          {item.candidate_count > 0 ? (
                            <button type="button" onClick={(event) => { sheetReturnFocus.current = event.currentTarget; runAction(() => openCandidates(item)); }}>
                              定位 {titleFor(item)}
                            </button>
                          ) : null}
                          <button type="button" aria-pressed={selected} onClick={() => toggleSelected(item)}>
                            {selected ? '取消' : '选择'} {titleFor(item)}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="plan-panel" aria-label="规划入口">
            <p>从目的地卡或底部输入开始。</p>
            {selectedItems.length > 0 ? <p>已选 {selectedItems.length} 个灵感作为锚点。</p> : null}
          </section>
        )}
      </section>

      <HomeImportDock controller={controller} selectedCount={selectedItems.length} onPlan={startWithSelection} onView={(id) => runAction(() => viewResult(id))} notice={notice} onHeight={setDockHeight} onRecognizedPlan={continueRecognized} active={!(unknownInput || candidateTarget || result || resultLoading)} />

      </div>
      {unknownInput && !candidateTarget && !result && !resultLoading ? (
        <HomeSheet label="选择输入类型" onClose={closeUnknown} restoreFocusTo={sheetReturnFocus.current}>
          <p>{unknownInput}</p>
          <div className="sheet-actions">
            <button type="button" onClick={handleUnknownAsLink}>
              作为链接入库
            </button>
            <button type="button" onClick={handleUnknownAsPlan}>
              作为旅行规划
            </button>
          </div>
          <button type="button" onClick={closeUnknown}>关闭</button>
        </HomeSheet>
      ) : null}

      {candidateTarget ? (
        <HomeSheet label="定位候选" onClose={closeCandidates} restoreFocusTo={sheetReturnFocus.current}>
          <h2>{titleFor(candidateTarget)}</h2>
          <div className="candidate-list">
            {candidates.map((candidate) => (
              <button key={candidate.candidate_id} type="button">
                <strong>{candidate.name}</strong>
                <span>{candidate.address}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={closeCandidates}>
            关闭
          </button>
        </HomeSheet>
      ) : null}
      {result || resultLoading ? <HomeSheet label="已保存的灵感" onClose={closeResult} restoreFocusTo={sheetReturnFocus.current}>
        {resultLoading ? <p role="status">正在读取已保存内容</p> : result ? <>
          <h2>{titleFor(result)}</h2><p>{summaryFor(result)}</p>
          <p>{result.city_name || (result.locate_status === 'pending' ? '待定位' : '已入库')} · {result.asset_count} 个素材</p>
          <button type="button" disabled={selectedIds.includes(result.id)} onClick={() => { if (!selectedIds.includes(result.id)) toggleSelected(result); closeResult(); setSegment('library'); runAction(refresh); }}>{selectedIds.includes(result.id) ? '已选此灵感' : '加入已选灵感'}</button>
        </> : null}
        <button type="button" onClick={closeResult}>关闭</button>
      </HomeSheet> : null}
    </main>
  );
}
