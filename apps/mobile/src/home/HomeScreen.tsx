import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Analytics } from '../auth/analytics';
import { createNoopAnalytics, sanitizeAnalyticsProps } from '../auth/analytics';
import type {
  HomeApiClient,
  HomeInputParseResponse,
  LibraryCandidate,
  LibraryCitySummary,
  LibraryInspirationItem,
  PlannerHandoff,
  PlannerHandoffSelectedItem,
} from './api';
import { createHomeApiClient } from './api';

type Segment = 'plan' | 'library';
type LibraryFilter = { kind: 'all' } | { kind: 'city'; city: LibraryCitySummary } | { kind: 'pending' };

export type HomeScreenProps = {
  apiClient?: HomeApiClient;
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

export function HomeScreen({ apiClient, analytics, onPlannerHandoff, onOpenSettings }: HomeScreenProps) {
  const client = useMemo(() => apiClient ?? createHomeApiClient(), [apiClient]);
  const tracker = useMemo(() => analytics ?? createNoopAnalytics(), [analytics]);
  const activeCandidateId = useRef<string | null>(null);
  const [segment, setSegment] = useState<Segment>('plan');
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>({ kind: 'all' });
  const [cities, setCities] = useState<LibraryCitySummary[]>([]);
  const [unlocatedCount, setUnlocatedCount] = useState(0);
  const [inspirations, setInspirations] = useState<LibraryInspirationItem[]>([]);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unknownInput, setUnknownInput] = useState<string | null>(null);
  const [candidateTarget, setCandidateTarget] = useState<LibraryInspirationItem | null>(null);
  const [candidates, setCandidates] = useState<LibraryCandidate[]>([]);
  const [selectedItems, setSelectedItems] = useState<LibraryInspirationItem[]>([]);

  const track = useCallback(
    (event: Parameters<Analytics['track']>[0], props?: Parameters<Analytics['track']>[1]) => {
      try {
        tracker.track(event, sanitizeAnalyticsProps(props));
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
    void refresh();
  }, [refresh, track]);

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
    activeCandidateId.current = item.id;
    setCandidateTarget(item);
    setCandidates([]);
    track('library_candidate_open', { item_id: item.id, candidate_count: item.candidate_count });
    try {
      const response = await client.getCandidates(item.id);
      if (activeCandidateId.current === item.id) setCandidates(response.candidates);
    } catch {
      if (activeCandidateId.current === item.id) setNotice('定位候选暂时不可用');
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

  const handleParsedInput = async (result: HomeInputParseResponse) => {
    track('home_input_classified', { type: result.type });
    if (result.type === 'xhs_link' && result.url) {
      const ingest = await client.startIngest({ url: result.url });
      track('home_ingest_start', { result: ingest.state, warning_code: ingest.warning?.code ?? result.warning?.code });
      setNotice(ingest.warning?.message || result.warning?.message || '已开始入库');
      return;
    }

    if (result.type === 'trip_params' && result.planner_handoff) {
      emitPlannerHandoff(result.planner_handoff);
      return;
    }

    setUnknownInput(result.original_text || input);
  };

  const handleUnknownAsLink = async () => {
    if (!unknownInput) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const ingest = await client.startIngest({ share_text: unknownInput });
      track('home_ingest_start', { result: ingest.state, warning_code: ingest.warning?.code });
      setUnknownInput(null);
      setNotice(ingest.warning?.message || '已开始入库');
    } catch {
      setNotice('链接入库失败，请检查内容后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnknownAsPlan = () => {
    if (!unknownInput) return;
    emitPlannerHandoff({
      route: routeForSelection(selectedItems),
      source: 'home_input',
      selected_items: [],
    });
    setUnknownInput(null);
  };

  const submitInput = async () => {
    const text = input.trim();
    if (!text) {
      setNotice('请输入链接或旅行想法');
      return;
    }
    setSubmitting(true);
    setNotice(null);
    track('home_input_submit', { length: text.length });
    try {
      await handleParsedInput(await client.parseInput({ text }));
    } catch {
      setNotice('输入解析失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="home-shell" aria-labelledby="home-title">
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
                            <button type="button" onClick={() => void openCandidates(item)}>
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
            <p className="status-text">平台额度可先用，需要更高额度时可配置我的 OpenAI Key。</p>
            <button type="button" onClick={onOpenSettings}>
              配置我的 OpenAI Key
            </button>
            {selectedItems.length > 0 ? <p>已选 {selectedItems.length} 个灵感作为锚点。</p> : null}
          </section>
        )}
      </section>

      {notice ? (
        <p className="notice home-notice" role="status">
          {notice}
        </p>
      ) : null}

      <footer className="home-input-bar">
        <label className="field">
          <span>统一输入</span>
          <textarea
            aria-label="统一输入"
            disabled={submitting}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴小红书链接，或输入：杭州 2026-07-02 出发 3天"
            rows={3}
            value={input}
          />
        </label>
        <div className="basket-bar">
          <span>已选 {selectedItems.length}</span>
          <button type="button" disabled={submitting || selectedItems.length === 0} onClick={startWithSelection}>
            开始规划
          </button>
          <button type="button" disabled={submitting} onClick={() => void submitInput()}>
            {submitting ? '处理中' : '发送'}
          </button>
        </div>
      </footer>

      {unknownInput ? (
        <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="选择输入类型">
          <p>{unknownInput}</p>
          <div className="sheet-actions">
            <button type="button" disabled={submitting} onClick={() => void handleUnknownAsLink()}>
              作为链接入库
            </button>
            <button type="button" disabled={submitting} onClick={handleUnknownAsPlan}>
              作为旅行规划
            </button>
          </div>
        </div>
      ) : null}

      {candidateTarget ? (
        <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="定位候选">
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
        </div>
      ) : null}
    </main>
  );
}
