import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const currentUser = {
  user_id: 'u_123',
  user: { id: 'u_123', phone: null },
  session: { id: 'sess_123', device_id: 'test-device', expires_at: new Date(Date.now() + 60_000).toISOString() },
};

const cities = {
  cities: [{ city_id: 'city-hz', name: '杭州', inspiration_count: 1, pending_count: 0 }],
  unlocated_count: 0,
};

const libraryItems = {
  items: [
    {
      id: 'ins-resolved',
      title: '西湖傍晚散步',
      summary: '作者推荐西湖边散步',
      locate_status: 'resolved',
      city_id: 'city-hz',
      city_name: '杭州',
      poi_id: 'poi-west-lake',
      poi_name: '西湖',
      poi_address: '杭州市西湖区',
      asset_count: 1,
      candidate_count: 0,
      created_at: '2026-06-19T08:00:00.000Z',
    },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores an existing cookie session before showing Home and handles Planner handoff', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/me')) return jsonResponse(currentUser);
      if (url.endsWith('/library/cities')) return jsonResponse(cities);
      if (url.includes('/library/inspirations')) return jsonResponse(libraryItems);
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('把收藏变成下一段行程')).toBeInTheDocument();
    expect(screen.queryByLabelText('手机号')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/me',
        expect.objectContaining({
          credentials: 'include',
        }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: '灵感' }));
    fireEvent.click(await screen.findByRole('button', { name: /选择 西湖傍晚散步/ }));
    fireEvent.click(screen.getByRole('button', { name: '开始规划' }));

    expect(await screen.findByRole('heading', { name: '行程选择已准备' })).toBeInTheDocument();
    expect(screen.getByText('已带入 1 个灵感锚点')).toBeInTheDocument();
  });

  it('opens Settings from the authenticated Home menu', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/me')) return jsonResponse(currentUser);
      if (url.endsWith('/library/cities')) return jsonResponse(cities);
      if (url.includes('/library/inspirations')) return jsonResponse(libraryItems);
      if (url.endsWith('/user-key')) return jsonResponse({ configured: false, provider: null, key_ref: null });
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '菜单' }));
    expect(await screen.findByRole('heading', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByText('平台额度可继续使用')).toBeInTheDocument();
  });

  it('routes AI quota education moments to BYOK configuration', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/me')) return jsonResponse(currentUser);
      if (url.endsWith('/library/cities')) return jsonResponse(cities);
      if (url.includes('/library/inspirations')) return jsonResponse(libraryItems);
      if (url.endsWith('/user-key')) return jsonResponse({ configured: false, provider: null, key_ref: null });
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '配置我的 OpenAI Key' }));
    expect(await screen.findByRole('heading', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByLabelText('OpenAI Key')).toBeInTheDocument();
  });
});
