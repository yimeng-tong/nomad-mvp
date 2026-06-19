import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Analytics } from '../auth/analytics';
import { createNoopAnalytics, sanitizeAnalyticsProps } from '../auth/analytics';
import { AuthApiError, type CurrentUserResponse } from '../auth/api';
import type { AccountTaskResponse, SettingsApiClient, UserKeyStatusResponse } from './api';
import { createSettingsApiClient } from './api';

export type SettingsScreenProps = {
  currentUser: CurrentUserResponse;
  apiClient?: SettingsApiClient;
  analytics?: Analytics;
  onBack: () => void;
  openExternal?: (url: string) => boolean | void | Promise<boolean | void>;
};

function taskStatusLabel(status: AccountTaskResponse['status']) {
  if (status === 'queued') return '已排队';
  if (status === 'in_progress') return '处理中';
  if (status === 'done') return '已完成';
  return '失败';
}

function defaultOpenExternal(url: string) {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return false;
  return Boolean(window.open(url, '_blank', 'noopener,noreferrer'));
}

export function SettingsScreen({ currentUser, apiClient, analytics, onBack, openExternal = defaultOpenExternal }: SettingsScreenProps) {
  const client = useMemo(() => apiClient ?? createSettingsApiClient(), [apiClient]);
  const tracker = useMemo(() => analytics ?? createNoopAnalytics(), [analytics]);
  const [byokStatus, setByokStatus] = useState<UserKeyStatusResponse | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [byokUnavailable, setByokUnavailable] = useState(false);
  const [exportTask, setExportTask] = useState<AccountTaskResponse | null>(null);
  const [deleteTask, setDeleteTask] = useState<AccountTaskResponse | null>(null);
  const [confirmExport, setConfirmExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [accountActionPending, setAccountActionPending] = useState(false);
  const [fallbackForm, setFallbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const track = useCallback(
    (event: Parameters<Analytics['track']>[0], props?: Parameters<Analytics['track']>[1]) => {
      try {
        tracker.track(event, sanitizeAnalyticsProps(props));
      } catch {
        // Analytics must never block Settings.
      }
    },
    [tracker],
  );

  useEffect(() => {
    track('settings_view', { source_page: 'settings' });
    let cancelled = false;
    void client
      .getByokStatus()
      .then((status) => {
        if (!cancelled) {
          setByokStatus(status);
          setByokUnavailable(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setByokUnavailable(true);
          setNotice('设置暂时不可用，请稍后重试');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, track]);

  const saveByok = async () => {
    const key = keyValue.trim();
    if (!key) {
      setNotice('请输入 OpenAI Key');
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const validation = await client.validateByok({ key });
      if (!validation.valid) {
        track('settings_byok_save_fail', { reason_code: 'BYOK_KEY_INVALID' });
        setNotice('密钥无效，请检查');
        setByokStatus({ configured: false, provider: null, key_ref: null });
        return;
      }
      const status = await client.saveByok({ key });
      setByokStatus(status);
      setKeyValue('');
      setNotice('已保存');
      track('settings_byok_save_success', { provider: status.provider ?? validation.provider ?? 'openai' });
    } catch (error) {
      setNotice(error instanceof AuthApiError && error.code === 'BYOK_KEY_INVALID' ? '密钥无效，请检查' : '密钥保存失败，请稍后重试');
      track('settings_byok_save_fail', { reason_code: error instanceof Error ? error.name : 'BYOK_SAVE_FAILED' });
    } finally {
      setSaving(false);
    }
  };

  const deleteByok = async () => {
    if (saving) return;
    setNotice(null);
    setSaving(true);
    try {
      await client.deleteByok();
      setByokStatus({ configured: false, provider: null, key_ref: null });
      setNotice('已回退到平台额度');
      track('settings_byok_delete', { result: 'success' });
    } catch {
      setNotice('密钥删除失败，请稍后重试');
      track('settings_byok_delete', { result: 'fail' });
    } finally {
      setSaving(false);
    }
  };

  const requestExport = async () => {
    if (accountActionPending) return;
    setAccountActionPending(true);
    try {
      const task = await client.requestDataExport();
      setExportTask(task);
      setConfirmExport(false);
      track('account_export_start', { task_status: task.status });
    } catch {
      setNotice('数据导出请求失败，请稍后重试');
    } finally {
      setAccountActionPending(false);
    }
  };

  const requestDeletion = async () => {
    if (accountActionPending) return;
    setAccountActionPending(true);
    try {
      const task = await client.requestAccountDeletion();
      setDeleteTask(task);
      setConfirmDelete(false);
      track('account_delete_start', { task_status: task.status });
    } catch {
      setNotice('账号删除请求失败，请稍后重试');
    } finally {
      setAccountActionPending(false);
    }
  };

  const openFeedback = async () => {
    try {
      const response = await client.getFeedbackLink({ source: 'settings' });
      track('feedback_open', { source_page: 'settings', mode: 'webview' });
      const opened = await openExternal(response.url);
      if (opened !== true) {
        setFallbackForm(true);
        setNotice('页面无法内嵌，请使用内置表单提交');
        track('feedback_submit_fail', { source_page: 'settings', mode: 'webview', error_code: 'OPEN_FAILED' });
      }
    } catch {
      setFallbackForm(true);
      setNotice('页面无法内嵌，请使用内置表单提交');
      track('feedback_submit_fail', { source_page: 'settings', mode: 'webview', error_code: 'LINK_FAILED' });
    }
  };

  const submitFallbackFeedback = async () => {
    const text = feedbackText.trim();
    if (!text) {
      setNotice('请填写反馈内容');
      track('feedback_submit_fail', { source_page: 'settings', mode: 'fallback_form', error_code: 'EMPTY' });
      return;
    }
    const mailto = `mailto:support@nomad-mvp.local?subject=${encodeURIComponent('Nomad feedback')}&body=${encodeURIComponent(text)}`;
    try {
      const opened = await openExternal(mailto);
      if (opened !== true) throw new Error('feedback submit open failed');
      setFeedbackText('');
      setNotice('反馈已提交到系统邮件');
      track('feedback_submit_success', { source_page: 'settings', mode: 'fallback_form' });
    } catch {
      setNotice('反馈暂未送达，请稍后重试');
      track('feedback_submit_fail', { source_page: 'settings', mode: 'fallback_form', error_code: 'SUBMIT_OPEN_FAILED' });
    }
  };

  return (
    <main className="settings-shell" aria-labelledby="settings-title">
      <header className="home-header">
        <button className="icon-button" type="button" aria-label="返回首页" onClick={onBack}>
          ←
        </button>
        <h1 id="settings-title">设置</h1>
      </header>

      <section className="settings-content">
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}

        <section className="settings-section" aria-labelledby="settings-account-title">
          <h2 id="settings-account-title">账号与登录</h2>
          <dl className="settings-facts">
            <div>
              <dt>用户</dt>
              <dd>{currentUser.user.id}</dd>
            </div>
            <div>
              <dt>设备</dt>
              <dd>{currentUser.session.device_id}</dd>
            </div>
          </dl>
        </section>

        <section className="settings-section" aria-labelledby="settings-byok-title">
          <h2 id="settings-byok-title">AI 与 BYOK</h2>
          <p>{byokUnavailable ? 'BYOK 状态暂时不可用' : byokStatus?.configured ? '已配置我的 OpenAI Key' : '平台额度可继续使用'}</p>
          {!byokUnavailable && !byokStatus?.configured ? <p className="status-text">当前使用平台额度，之后可在这里配置我的 OpenAI Key。</p> : null}
          <label className="field">
            <span>OpenAI Key</span>
            <input
              aria-label="OpenAI Key"
              autoComplete="off"
              onChange={(event) => setKeyValue(event.target.value)}
              placeholder="sk-..."
              type="password"
              value={keyValue}
            />
          </label>
          <div className="settings-actions">
            <button type="button" disabled={saving} onClick={() => void saveByok()}>
              保存密钥
            </button>
            <button type="button" disabled={saving} onClick={() => void deleteByok()}>
              删除密钥
            </button>
          </div>
          {!byokStatus?.configured && notice === '密钥无效，请检查' ? <p className="status-text">已回退到平台额度</p> : null}
        </section>

        <section className="settings-section" aria-labelledby="settings-data-title">
          <h2 id="settings-data-title">数据与隐私</h2>
          <div className="settings-actions">
            <button type="button" disabled={accountActionPending} onClick={() => setConfirmExport(true)}>
              导出数据
            </button>
            <button type="button" disabled={accountActionPending} onClick={() => setConfirmDelete(true)}>
              删除账号
            </button>
          </div>
          {exportTask ? <p>数据导出：{taskStatusLabel(exportTask.status)}</p> : null}
          {deleteTask ? <p>账号删除：{taskStatusLabel(deleteTask.status)}</p> : null}
          {confirmExport ? (
            <div className="inline-state">
              <p>导出数据会排队生成账号数据副本。</p>
              <button type="button" disabled={accountActionPending} onClick={() => void requestExport()}>
                确认导出数据
              </button>
            </div>
          ) : null}
          {confirmDelete ? (
            <div className="inline-state">
              <p>删除账号会排队处理账号与数据清理。</p>
              <button type="button" disabled={accountActionPending} onClick={() => void requestDeletion()}>
                确认删除账号
              </button>
            </div>
          ) : null}
        </section>

        <section className="settings-section" aria-labelledby="settings-feedback-title">
          <h2 id="settings-feedback-title">反馈与建议</h2>
          <button type="button" onClick={() => void openFeedback()}>
            反馈与建议
          </button>
          {fallbackForm ? (
            <div className="fallback-form">
              <p>内置表单已启用，可提交文本与截图</p>
              <label className="field">
                <span>反馈内容</span>
                <textarea aria-label="反馈内容" rows={4} value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} />
              </label>
              <button type="button" onClick={() => void submitFallbackFeedback()}>
                提交反馈
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
