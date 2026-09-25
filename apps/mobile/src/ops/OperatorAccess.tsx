import { useEffect, useMemo, useState } from 'react';
import { AuthApiError, getApiBaseUrl } from '../auth/api';
import { createBoundJsonRequest } from '../auth/transport';
import { useAuthSnapshot } from '../auth/session-context';
import type { components } from 'nomad-types/src/api-types';

type Grant = components['schemas']['OperatorGrant'];
type Access = components['schemas']['OperatorAccessResponse'];
const labels: Record<string, string> = { 'places.correct': '地点纠错', 'brand.rules': '品牌规则', 'ops.workbench': '运行工作台', 'ops.prompts': '提示版本', 'ops.rollout': '发布控制', 'ops.usage': '用量核对' };
async function parseError(response: Response) {
  let code = 'AUTH_OPERATOR_UNAVAILABLE';
  try { code = ((await response.json()) as components['schemas']['ErrorEnvelope']).error_code || code; } catch { /* Fixed public error only. */ }
  return new AuthApiError('Operator access unavailable', { status: response.status, code });
}
export function OperatorAccess({ onLogout }: { onLogout: () => void }) {
  const auth = useAuthSnapshot();
  const request = useMemo(() => createBoundJsonRequest(getApiBaseUrl(), parseError), [auth.epoch]);
  const [access, setAccess] = useState<Access | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'denied' | 'unavailable'>('loading');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState<{ receipt_id: string; verified_at: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [intent, setIntent] = useState<{ grant: Grant; id: string } | null>(null);
  useEffect(() => {
    if (auth.phase !== 'authenticated') return;
    let cancelled = false; setState('loading'); setReceipt(null);
    void request<Access>('/ops/me').then((result) => { if (!cancelled) { setAccess(result); setState('ready'); } })
      .catch((error) => { if (!cancelled) { setAccess(null); setState(error instanceof AuthApiError && error.status === 403 ? 'denied' : 'unavailable'); } });
    return () => { cancelled = true; };
  }, [request, retry, auth.phase]);
  const check = async (grant: Grant) => {
    if (pending) return;
    const operation = intent && intent.grant.capability === grant.capability && intent.grant.scope === grant.scope && intent.grant.version === grant.version
      ? intent : { grant, id: crypto.randomUUID() };
    setIntent(operation); setPending(true); setReceipt(null); setNotice('');
    try {
      const result = await request<{ receipt_id: string; verified_at: string }>('/ops/access-check', {
        method: 'POST', body: JSON.stringify({ capability: grant.capability, scope: grant.scope, expected_grant_version: grant.version, operation_id: operation.id }),
      });
      setReceipt(result); setIntent(null); setNotice('授权校验已写入审计记录');
    } catch (error) {
      if (error instanceof AuthApiError && [403,409].includes(error.status)) { setAccess(null); setState('denied'); setIntent(null); setNotice('授权已变化，请重新读取'); }
      else setNotice('校验结果尚未确认，可重试同一次校验');
    } finally { setPending(false); }
  };
  return <main className="operator-shell" aria-labelledby="operator-title">
    <header><h1 id="operator-title">Nomad 运营授权</h1><button type="button" disabled={pending} onClick={onLogout}>退出当前登录</button></header>
    <p>此入口显示服务端当前授予的能力和范围。授权校验只写入审计记录。</p>
    <div role="status" aria-live="polite">
      {state === 'loading' ? <p>正在读取授权</p> : state === 'denied' ? <p>当前账号没有可用的运营授权</p> : state === 'unavailable' ? <p>暂时无法确认运营授权</p> : null}
      {notice ? <p>{notice}</p> : null}
      {receipt ? <p>回执：{receipt.receipt_id} · {new Date(receipt.verified_at).toLocaleString()}</p> : null}
    </div>
    {state !== 'loading' ? <button type="button" disabled={pending} onClick={() => setRetry((value) => value + 1)}>重新读取授权</button> : null}
    {state === 'ready' && access ? <table><caption>当前账号的有效授权</caption><thead><tr><th>能力</th><th>范围</th><th>版本</th><th>校验</th></tr></thead><tbody>
      {access.grants.map((grant) => <tr key={`${grant.capability}:${grant.scope}`}><td>{labels[grant.capability] ?? grant.capability}</td><td>{grant.scope}</td><td>{grant.version}</td>
        <td><button type="button" disabled={pending} onClick={() => void check(grant)}>验证{labels[grant.capability] ?? '当前'}授权</button></td></tr>)}
    </tbody></table> : null}
  </main>;
}
