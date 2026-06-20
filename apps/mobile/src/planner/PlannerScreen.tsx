import { useEffect, useMemo, useState } from 'react';
import type { Analytics } from '../auth/analytics';
import { createNoopAnalytics, sanitizeAnalyticsProps } from '../auth/analytics';
import type { LibraryCitySummary, LibraryInspirationItem, PlannerHandoff, PlannerHandoffSelectedItem } from '../home/api';
import { createPlannerApiClient, type PlanGenerateRequest, type PlannerApiClient, type PlannerTimeHint, type SearchPoiItem } from './api';

type PlannerScreenProps = {
  handoff: PlannerHandoff;
  apiClient?: PlannerApiClient;
  analytics?: Analytics;
  onBack: () => void;
};

type Pace = 'tight' | 'comfortable';
type ViewMode = 'confirm' | 'picker';
type StretchMode = 'nearby' | 'split' | 'city';

type HotelInput = {
  date: string;
  hotelName: string;
  poiId?: string | null;
  address?: string | null;
  breakfastIncluded: boolean;
  leaveBlank: boolean;
};

type ConfirmState = {
  city: string;
  startDate: string;
  days: string;
  pace: Pace;
  wakePreference: string;
  morningStartTime: string;
  firstDayArrivalTime: string;
  lastDayDepartureTime: string;
  smartPlanning: boolean;
  hotels: HotelInput[];
  luggageMode: NonNullable<NonNullable<PlanGenerateRequest['luggage_plan']>['mode']>;
  luggageNotes: string;
  hotelChangeHelpNeeded: boolean;
};

type PickerItem = {
  itemId: string;
  poiId?: string | null;
  name: string;
  summary: string;
  cityName: string | null;
  l2: string;
  source: 'library' | 'home_card' | 'home_input' | 'uploaded_inspiration';
  timeHint?: PlannerTimeHint;
  stayMinutesHint?: number;
};

type HotelMatchState = {
  loading?: boolean;
  error?: string | null;
  items?: SearchPoiItem[];
};

const cityCenters: Record<string, { lat: number; lng: number }> = {
  厦门: { lat: 24.4798, lng: 118.0894 },
  泉州: { lat: 24.8741, lng: 118.6759 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  上海: { lat: 31.2304, lng: 121.4737 },
};

function parsePlannerRoute(route: string) {
  const url = new URL(route, 'https://nomad.local');
  return {
    city: url.searchParams.get('city') || '',
    startDate: url.searchParams.get('start') || '',
    days: url.searchParams.get('days') || '',
    pace: (url.searchParams.get('pace') === 'tight' ? 'tight' : 'comfortable') as Pace,
    source: (url.searchParams.get('source') === 'home_card' ? 'home_card' : 'home_input') as 'home_input' | 'home_card',
    recId: url.searchParams.get('rec_id') || null,
  };
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(isoDate: string, offset: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function hotelRows(startDate: string, dayCount: number, existing: HotelInput[] = []) {
  const days = Math.max(1, Math.min(dayCount || 1, 14));
  return Array.from({ length: days }, (_, index) => {
    const date = isIsoDate(startDate) ? addDays(startDate, index) : '';
    const current = existing[index];
    return {
      date,
      hotelName: current?.hotelName ?? '',
      poiId: current?.poiId ?? null,
      address: current?.address ?? null,
      breakfastIncluded: current?.breakfastIncluded ?? false,
      leaveBlank: current?.leaveBlank ?? false,
    };
  });
}

function textForTimeHint(item: LibraryInspirationItem) {
  return `${item.title || ''} ${item.summary || ''} ${item.poi_name || ''}`.toLowerCase();
}

function inferTimeHint(item: LibraryInspirationItem | Pick<PickerItem, 'name' | 'summary'>): PlannerTimeHint | undefined {
  const text = 'title' in item ? textForTimeHint(item) : `${item.name} ${item.summary}`.toLowerCase();
  if (/日出|清晨|dawn|sunrise/u.test(text)) return 'dawn';
  if (/日落|黄昏|sunset/u.test(text)) return 'sunset';
  if (/夜市|night market/u.test(text)) return 'night_market';
  if (/夜景|夜间|晚上|night/u.test(text)) return 'night';
  if (/上午|早上|morning/u.test(text)) return 'morning';
  return undefined;
}

function areaFor(item: LibraryInspirationItem | Pick<PickerItem, 'name' | 'summary' | 'cityName'>) {
  const text = 'poi_name' in item ? `${item.poi_name || ''} ${item.title || ''} ${item.summary || ''}` : `${item.name} ${item.summary}`;
  if (/日光岩|菽庄|最美转角|鼓浪屿/u.test(text)) return '鼓浪屿';
  if (/黄厝|环岛|曾厝垵|沙滩|海滩/u.test(text)) return '环岛路';
  if (/中山|骑楼|八市|夜市/u.test(text)) return '中山路';
  if (/沙坡尾|艺术西区/u.test(text)) return '沙坡尾';
  return ('cityName' in item ? item.cityName : item.city_name) || '附近灵感';
}

function titleFor(item: LibraryInspirationItem) {
  return item.poi_name || item.title || item.summary || '未命名地点';
}

function summaryFor(item: LibraryInspirationItem) {
  return item.summary || item.poi_address || item.city_name || '来自灵感库';
}

function mapLibraryItem(item: LibraryInspirationItem): PickerItem {
  return {
    itemId: item.id,
    poiId: item.poi_id,
    name: titleFor(item),
    summary: summaryFor(item),
    cityName: item.city_name,
    l2: areaFor(item),
    source: 'library',
    timeHint: inferTimeHint(item),
    stayMinutesHint: 90,
  };
}

function mapHandoffItem(item: PlannerHandoffSelectedItem, cityName: string, index: number): PickerItem {
  const fallback: PickerItem = {
    itemId: item.item_id,
    poiId: item.poi_id,
    name: `已选灵感 ${index + 1}`,
    summary: '来自首页选择',
    cityName,
    l2: cityName || '附近灵感',
    source: item.source || 'home_input',
    timeHint: item.time_hint,
    stayMinutesHint: item.stay_minutes_hint ?? 90,
  };
  return { ...fallback, l2: areaFor(fallback) };
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function citySortScore(city: LibraryCitySummary, targetCity: string) {
  const anyCity = city as LibraryCitySummary & { distance_km?: number; center_lat?: number; center_lng?: number };
  if (Number.isFinite(anyCity.distance_km)) return Number(anyCity.distance_km);
  const target = cityCenters[targetCity];
  const center = Number.isFinite(anyCity.center_lat) && Number.isFinite(anyCity.center_lng) ? { lat: Number(anyCity.center_lat), lng: Number(anyCity.center_lng) } : cityCenters[city.name];
  if (target && center) return distanceKm(target, center);
  return city.name === targetCity ? 0 : 9999;
}

function sortedTabs(cities: LibraryCitySummary[], targetCity: string) {
  return cities
    .filter((city) => city.inspiration_count > 1)
    .slice()
    .sort((a, b) => citySortScore(a, targetCity) - citySortScore(b, targetCity) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

function groupItems(items: PickerItem[]) {
  return items.reduce<Record<string, PickerItem[]>>((groups, item) => {
    groups[item.l2] = [...(groups[item.l2] || []), item];
    return groups;
  }, {});
}

function deriveHardTimeHints(items: PickerItem[]): NonNullable<PlanGenerateRequest['hard_time_hints']> {
  return items
    .filter((item) => item.timeHint && ['dawn', 'sunset', 'night', 'night_market'].includes(item.timeHint))
    .map((item) => ({
      item_id: item.itemId,
      poi_id: item.poiId || null,
      time_hint: item.timeHint as PlannerTimeHint,
      source: 'uploaded_inspiration' as const,
    }));
}

function timeHintLabel(hint: PlannerTimeHint) {
  const labels: Record<PlannerTimeHint, string> = {
    dawn: '清晨时段',
    morning: '上午时段',
    afternoon: '下午时段',
    sunset: '日落时段',
    evening: '傍晚时段',
    night: '夜间时段',
    night_market: '夜市时段',
  };
  return labels[hint];
}

export function PlannerScreen({ handoff, apiClient, analytics, onBack }: PlannerScreenProps) {
  const routeParams = useMemo(() => parsePlannerRoute(handoff.route), [handoff.route]);
  const client = useMemo(() => apiClient ?? createPlannerApiClient(), [apiClient]);
  const tracker = useMemo(() => analytics ?? createNoopAnalytics(), [analytics]);
  const [viewMode, setViewMode] = useState<ViewMode>('confirm');
  const [stretchMode, setStretchMode] = useState<StretchMode>('nearby');
  const [cities, setCities] = useState<LibraryCitySummary[]>([]);
  const [inspirations, setInspirations] = useState<LibraryInspirationItem[]>([]);
  const [networkFallback, setNetworkFallback] = useState(false);
  const [hotelMatches, setHotelMatches] = useState<Record<number, HotelMatchState>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => handoff.selected_items.map((item) => item.item_id));
  const [activeCity, setActiveCity] = useState(routeParams.city);
  const [activeL2, setActiveL2] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(() => ({
    city: routeParams.city,
    startDate: routeParams.startDate,
    days: routeParams.days,
    pace: routeParams.pace,
    wakePreference: '08:30',
    morningStartTime: '09:30',
    firstDayArrivalTime: '',
    lastDayDepartureTime: '',
    smartPlanning: true,
    hotels: hotelRows(routeParams.startDate, Number(routeParams.days || 1)),
    luggageMode: 'undecided',
    luggageNotes: '',
    hotelChangeHelpNeeded: false,
  }));

  const track = (event: Parameters<Analytics['track']>[0], props?: Parameters<Analytics['track']>[1]) => {
    try {
      tracker.track(event, sanitizeAnalyticsProps(props));
    } catch {
      // Analytics must not affect planning.
    }
  };

  useEffect(() => {
    track('confirm_open', { source: routeParams.source, selected_count: handoff.selected_items.length });
    let cancelled = false;
    Promise.all([client.getCities(), client.getInspirations()])
      .then(([cityResponse, inspirationResponse]) => {
        if (cancelled) return;
        setCities(cityResponse.cities);
        setInspirations(inspirationResponse.items);
      })
      .catch(() => {
        if (cancelled) return;
        setNetworkFallback(true);
        setNotice('网络较差，已切换为清单模式');
      });
    return () => {
      cancelled = true;
    };
  }, [client, handoff.selected_items.length, routeParams.source]);

  useEffect(() => {
    const timers = confirm.hotels.map((hotel, index) => {
      const q = hotel.hotelName.trim();
      if (!confirm.city.trim() || hotel.leaveBlank || q.length < 2) return undefined;
      setHotelMatches((current) => ({ ...current, [index]: { ...(current[index] || {}), loading: true, error: null } }));
      return window.setTimeout(() => {
        void client
          .searchPoi({ city: confirm.city.trim(), q, topk: 3 })
          .then((response) => {
            setHotelMatches((current) => ({ ...current, [index]: { loading: false, items: response.items || [], error: null } }));
          })
          .catch(() => {
            setHotelMatches((current) => ({ ...current, [index]: { loading: false, items: [], error: '酒店匹配暂时不可用' } }));
          });
      }, 250);
    });
    return () => {
      timers.forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [client, confirm.city, confirm.hotels]);

  const targetCity = confirm.city || activeCity;
  const cityTabs = useMemo(() => sortedTabs(cities, targetCity), [cities, targetCity]);
  const libraryItems = useMemo(() => inspirations.map(mapLibraryItem), [inspirations]);
  const visibleLibraryItems = useMemo(() => {
    const cityName = activeCity || targetCity;
    const filtered = libraryItems.filter((item) => !cityName || item.cityName === cityName);
    return filtered.length > 0 ? filtered : libraryItems;
  }, [activeCity, libraryItems, targetCity]);
  const missingHandoffItems = useMemo(() => {
    const knownIds = new Set(visibleLibraryItems.map((item) => item.itemId));
    return handoff.selected_items.filter((item) => !knownIds.has(item.item_id)).map((item, index) => mapHandoffItem(item, targetCity, index));
  }, [handoff.selected_items, targetCity, visibleLibraryItems]);
  const pickerItems = useMemo(() => [...visibleLibraryItems, ...missingHandoffItems], [missingHandoffItems, visibleLibraryItems]);
  const groupedItems = useMemo(() => groupItems(pickerItems), [pickerItems]);
  const selectedItems = useMemo(() => pickerItems.filter((item) => selectedIds.includes(item.itemId)), [pickerItems, selectedIds]);
  const activeArea = activeL2 || Object.keys(groupedItems)[0] || '附近灵感';

  const updateConfirm = (patch: Partial<ConfirmState>) => {
    setConfirm((current) => {
      const next = { ...current, ...patch };
      if ('startDate' in patch || 'days' in patch) {
        next.hotels = hotelRows(next.startDate, Number(next.days || 1), current.hotels);
      }
      return next;
    });
  };

  const updateHotel = (index: number, patch: Partial<HotelInput>) => {
    setConfirm((current) => ({
      ...current,
      hotels: current.hotels.map((hotel, hotelIndex) => (hotelIndex === index ? { ...hotel, ...patch } : hotel)),
    }));
  };

  const selectHotelMatch = (index: number, item: SearchPoiItem) => {
    updateHotel(index, {
      hotelName: item.name,
      poiId: item.poi_id,
      address: item.address,
      leaveBlank: false,
    });
    setHotelMatches((current) => ({ ...current, [index]: { loading: false, items: [], error: null } }));
  };

  const validateConfirm = () => {
    const nextErrors: string[] = [];
    if (!confirm.city.trim()) nextErrors.push('请选择城市');
    if (!isIsoDate(confirm.startDate) || !Number.isInteger(Number(confirm.days)) || Number(confirm.days) < 1) nextErrors.push('请完善出行时间');
    if (!confirm.firstDayArrivalTime) nextErrors.push('请选择出发时间');
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const continueToPicker = () => {
    if (!validateConfirm()) return;
    setActiveCity(confirm.city);
    setViewMode('picker');
    setErrors([]);
    track('confirm_continue', {
      source: routeParams.source,
      selected_count: selectedIds.length,
      days: Number(confirm.days),
      pace: confirm.pace,
      has_luggage: Boolean(confirm.luggageNotes || confirm.hotelChangeHelpNeeded),
    });
    track('picker_open', { source: routeParams.source, city: confirm.city, selected_count: selectedIds.length });
  };

  const toggleSelected = (item: PickerItem) => {
    setSelectedIds((current) => {
      const selected = current.includes(item.itemId);
      track(selected ? 'picker_remove_inspiration' : 'picker_add_inspiration', {
        item_id: item.itemId,
        source: item.source,
        l2: item.l2,
      });
      return selected ? current.filter((id) => id !== item.itemId) : [...current, item.itemId];
    });
  };

  const buildGeneratePayload = (): PlanGenerateRequest => {
    const selectedSet = new Set(selectedIds);
    const sourceItems = pickerItems.length > 0 ? pickerItems : missingHandoffItems;
    const selected = sourceItems.filter((item) => selectedSet.has(item.itemId));
    const candidates = sourceItems.filter((item) => !selectedSet.has(item.itemId));
    return {
      city: confirm.city,
      start_date: confirm.startDate,
      days: Number(confirm.days),
      pace: confirm.pace,
      source: routeParams.source,
      rec_id: routeParams.recId,
      selected_items: selected.map((item) => ({
        item_id: item.itemId,
        poi_id: item.poiId || null,
        source: item.source,
        anchor_intent: 'selected_required',
        time_hint: item.timeHint,
        stay_minutes_hint: item.stayMinutesHint,
      })),
      candidate_items: candidates.map((item) => ({
        item_id: item.itemId,
        poi_id: item.poiId || null,
        source: item.source,
        time_hint: item.timeHint,
        stay_minutes_hint: item.stayMinutesHint,
      })),
      hotels: confirm.hotels.map((hotel) => ({
        date: hotel.date || confirm.startDate,
        hotel_name: hotel.leaveBlank ? null : hotel.hotelName || null,
        poi_id: hotel.poiId || null,
        address: hotel.address || null,
        breakfast_included: hotel.breakfastIncluded,
        leave_blank: hotel.leaveBlank,
      })),
      luggage_plan: {
        mode: confirm.luggageMode,
        notes: confirm.luggageNotes || null,
        hotel_change_help_needed: confirm.hotelChangeHelpNeeded,
      },
      wake_preference: confirm.wakePreference || null,
      morning_start_time: confirm.morningStartTime || null,
      first_day_arrival_time: confirm.firstDayArrivalTime || null,
      last_day_departure_time: confirm.lastDayDepartureTime || null,
      smart_planning: confirm.smartPlanning,
      hard_time_hints: deriveHardTimeHints(sourceItems),
    };
  };

  const startPlanning = async () => {
    const payload = buildGeneratePayload();
    setSubmitting(true);
    setNotice(null);
    track('picker_generate_skeleton', {
      selected_count: payload.selected_items?.length || 0,
      candidate_count: payload.candidate_items?.length || 0,
      hard_time_hint_count: payload.hard_time_hints?.length || 0,
    });
    try {
      const response = await client.generatePlan(payload);
      setNotice(`规划已开始：${response.sse_url || response.plan_job_id}`);
    } catch {
      setNotice('开始规划失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="planner-shell" aria-labelledby={viewMode === 'confirm' ? 'planner-confirm-title' : 'planner-picker-title'}>
      <header className="planner-header">
        <button className="icon-button" type="button" aria-label="返回首页" onClick={viewMode === 'confirm' ? onBack : () => setViewMode('confirm')}>
          ←
        </button>
        <div>
          <p className="brand-kicker">Planner</p>
          <p className="planner-param-line">
            {confirm.city || '待填写'} · {confirm.startDate || '待填写'} · {confirm.days ? `${confirm.days}天` : '待填写'}
          </p>
        </div>
        {viewMode === 'picker' ? (
          <button className="planner-text-button" type="button" onClick={() => setViewMode('confirm')}>
            编辑参数
          </button>
        ) : null}
      </header>

      {notice ? (
        <p className="notice" role="status">
          {notice}
        </p>
      ) : null}

      {viewMode === 'confirm' ? (
        <section className="planner-content" aria-label="确认旅行参数">
          <h1 id="planner-confirm-title">确认旅行参数</h1>
          <p className="status-text">已带入 {handoff.selected_items.length} 个灵感</p>

          {errors.length > 0 ? (
            <div className="planner-errors" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <div className="planner-form-grid">
            <label className="field">
              <span>城市</span>
              <input value={confirm.city} onChange={(event) => updateConfirm({ city: event.target.value })} placeholder="请选择城市" />
            </label>
            <label className="field">
              <span>出行日期</span>
              <input value={confirm.startDate} onChange={(event) => updateConfirm({ startDate: event.target.value })} placeholder="2026-07-02" />
            </label>
            <label className="field">
              <span>天数</span>
              <input inputMode="numeric" value={confirm.days} onChange={(event) => updateConfirm({ days: event.target.value })} placeholder="3" />
            </label>
          </div>

          <section className="planner-section" aria-label="节奏">
            <h2>节奏</h2>
            <div className="segment-control planner-segment" aria-label="行程节奏">
              <button type="button" aria-pressed={confirm.pace === 'comfortable'} onClick={() => updateConfirm({ pace: 'comfortable' })}>
                舒适
              </button>
              <button type="button" aria-pressed={confirm.pace === 'tight'} onClick={() => updateConfirm({ pace: 'tight' })}>
                紧凑
              </button>
            </div>
          </section>

          <section className="planner-section" aria-label="时间偏好">
            <h2>时间</h2>
            <div className="planner-form-grid">
              <label className="field">
                <span>起床时间</span>
                <input value={confirm.wakePreference} onChange={(event) => updateConfirm({ wakePreference: event.target.value })} placeholder="08:30" />
              </label>
              <label className="field">
                <span>上午出发</span>
                <input value={confirm.morningStartTime} onChange={(event) => updateConfirm({ morningStartTime: event.target.value })} placeholder="09:30" />
              </label>
              <label className="field">
                <span>首日到达</span>
                <input value={confirm.firstDayArrivalTime} onChange={(event) => updateConfirm({ firstDayArrivalTime: event.target.value })} placeholder="11:20" />
              </label>
              <label className="field">
                <span>末日离开</span>
                <input value={confirm.lastDayDepartureTime} onChange={(event) => updateConfirm({ lastDayDepartureTime: event.target.value })} placeholder="18:45" />
              </label>
            </div>
          </section>

          <section className="planner-section" aria-label="酒店（可留空）">
            <h2>酒店（可留空）</h2>
            <div className="hotel-list">
              {confirm.hotels.map((hotel, index) => (
                <div className="hotel-row" key={`${hotel.date || index}-${index}`}>
                  <label className="field">
                    <span>{hotel.date || `第${index + 1}晚`}</span>
                    <input
                      value={hotel.hotelName}
                      disabled={hotel.leaveBlank}
                      onChange={(event) => updateHotel(index, { hotelName: event.target.value, poiId: null, address: null, leaveBlank: false })}
                      placeholder="输入酒店名称，高德匹配"
                    />
                  </label>
                  <div className="hotel-row-actions">
                    <label>
                      <input
                        checked={hotel.breakfastIncluded}
                        type="checkbox"
                        onChange={(event) => updateHotel(index, { breakfastIncluded: event.target.checked })}
                      />
                      含早餐
                    </label>
                    <button type="button" onClick={() => updateHotel(index, { hotelName: '', poiId: null, address: null, leaveBlank: true })}>
                      留空
                    </button>
                  </div>
                  {hotel.hotelName && !hotel.leaveBlank ? (
                    <div className="hotel-match-list" aria-label={`${hotel.hotelName} 高德匹配`}>
                      {hotelMatches[index]?.loading ? <p className="status-text">正在匹配高德 POI</p> : null}
                      {hotel.poiId ? <p className="status-text">已选择地址 · {hotel.address}</p> : null}
                      {hotelMatches[index]?.error ? <p className="status-text">{hotelMatches[index]?.error}</p> : null}
                      {(hotelMatches[index]?.items || []).map((item) => (
                        <button key={item.poi_id} type="button" onClick={() => selectHotelMatch(index, item)}>
                          <strong>{item.name}</strong>
                          <span>{item.address}</span>
                        </button>
                      ))}
                      {!hotelMatches[index]?.loading && !hotel.poiId && (hotelMatches[index]?.items || []).length === 0 ? <p className="status-text">待定位 · 选择地址</p> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="planner-section" aria-label="行李">
            <h2>行李</h2>
            <label className="field">
              <span>处理方式</span>
              <select value={confirm.luggageMode} onChange={(event) => updateConfirm({ luggageMode: event.target.value as ConfirmState['luggageMode'] })}>
                <option value="undecided">待确认</option>
                <option value="carry_with_me">随身携带</option>
                <option value="hotel_storage">酒店寄存</option>
                <option value="station_storage">车站寄存</option>
                <option value="courier">行李托运/寄送</option>
              </select>
            </label>
            <label className="field">
              <span>补充说明</span>
              <textarea value={confirm.luggageNotes} onChange={(event) => updateConfirm({ luggageNotes: event.target.value })} placeholder="例如：换酒店当天先寄存" />
            </label>
            <label className="planner-checkbox">
              <input
                checked={confirm.hotelChangeHelpNeeded}
                type="checkbox"
                onChange={(event) => updateConfirm({ hotelChangeHelpNeeded: event.target.checked })}
              />
              换酒店当天需要处理行李
            </label>
          </section>

          <label className="planner-checkbox">
            <input checked={confirm.smartPlanning} type="checkbox" onChange={(event) => updateConfirm({ smartPlanning: event.target.checked })} />
            智能规划
          </label>

          <button className="planner-primary" type="button" onClick={continueToPicker}>
            继续选择灵感
          </button>
        </section>
      ) : (
        <section className="planner-content planner-picker" aria-label="灵感选择">
          <h1 id="planner-picker-title">选择灵感</h1>

          <div className="city-chip-row" aria-label="城市灵感">
            {cityTabs.map((city) => (
              <button
                key={city.city_id}
                type="button"
                aria-pressed={(activeCity || targetCity) === city.name}
                onClick={() => {
                  setActiveCity(city.name);
                  setActiveL2(null);
                }}
              >
                {city.name} {city.inspiration_count}
              </button>
            ))}
          </div>

          <section className="map-sheet" aria-label="地图联动">
            <div className="map-toolbar" aria-label="地图范围">
              <button type="button" aria-pressed={stretchMode === 'nearby'} onClick={() => setStretchMode('nearby')}>
                附近
              </button>
              <button type="button" aria-pressed={stretchMode === 'split'} onClick={() => setStretchMode('split')}>
                半屏
              </button>
              <button type="button" aria-pressed={stretchMode === 'city'} onClick={() => setStretchMode('city')}>
                全城
              </button>
            </div>
            <p>
              {stretchMode === 'nearby' ? `附近 · ${activeArea}` : stretchMode === 'split' ? `半屏 · ${activeArea} 与附近区域` : `${targetCity || '目的地'} · L2 分布`}
            </p>
            {networkFallback ? (
              <button type="button" onClick={() => setNotice('已使用清单模式继续选择')}>
                仅列表继续
              </button>
            ) : null}
          </section>

          {pickerItems.length === 0 ? <p className="empty-state">暂无可用灵感，试试更换城市或关键词</p> : null}

          <div className="l2-list">
            {Object.entries(groupedItems).map(([l2, items]) => {
              const selectedCount = items.filter((item) => selectedIds.includes(item.itemId)).length;
              return (
                <section className="l2-group" key={l2} aria-label={`${l2} 已选 ${selectedCount} 个L3`}>
                  <button className="l2-heading" type="button" onClick={() => setActiveL2(l2)}>
                    <span className={selectedCount > 0 ? 'l2-dot selected' : 'l2-dot'} aria-hidden="true" />
                    <strong>{l2}</strong>
                    <span>{selectedCount > 0 ? `${selectedCount} 个已选` : '可选'}</span>
                  </button>
                  <div className="l3-list">
                    {items.map((item) => {
                      const selected = selectedIds.includes(item.itemId);
                      return (
                        <article className="l3-row" key={item.itemId}>
                          <div>
                            <h2>{item.name}</h2>
                            <p>{item.summary}</p>
                            {item.timeHint ? <span>{timeHintLabel(item.timeHint)}</span> : null}
                          </div>
                          <button type="button" aria-pressed={selected} onClick={() => toggleSelected(item)}>
                            {selected ? '已选' : '选择'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="planner-basket" aria-label="已选灵感">
            <span>已选 {selectedItems.length}</span>
            <button type="button" disabled={submitting || !confirm.city || !confirm.startDate || !confirm.days} onClick={() => void startPlanning()}>
              {submitting ? '规划中' : '开始规划'}
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
