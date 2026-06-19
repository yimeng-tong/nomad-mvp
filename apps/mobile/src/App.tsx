import { useEffect, useState } from 'react';
import { LoginScreen } from './auth/LoginScreen';
import { createAuthApiClient, type CurrentUserResponse } from './auth/api';
import { HomeScreen } from './home/HomeScreen';
import type { PlannerHandoff } from './home/api';
import { SettingsScreen } from './settings/SettingsScreen';
import './styles.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [plannerHandoff, setPlannerHandoff] = useState<PlannerHandoff | null>(null);
  const [view, setView] = useState<'home' | 'settings'>('home');

  useEffect(() => {
    let cancelled = false;
    void createAuthApiClient()
      .getCurrentUser()
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setSessionChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!sessionChecked) {
    return (
      <main className="login-shell" aria-label="正在恢复登录状态">
        <section className="login-stage">
          <p className="status-text">正在恢复登录状态</p>
        </section>
      </main>
    );
  }

  if (!currentUser) return <LoginScreen onAuthenticated={setCurrentUser} />;

  if (view === 'settings') {
    return <SettingsScreen currentUser={currentUser} onBack={() => setView('home')} />;
  }

  if (plannerHandoff) {
    return (
      <main className="home-shell" aria-labelledby="planner-handoff-title">
        <header className="home-header">
          <button className="icon-button" type="button" aria-label="返回首页" onClick={() => setPlannerHandoff(null)}>
            ←
          </button>
        </header>
        <section className="home-content planner-placeholder">
          <p className="brand-kicker">Planner</p>
          <h1 id="planner-handoff-title">行程选择已准备</h1>
          <p className="status-text">{plannerHandoff.route}</p>
          <p className="notice" role="status">
            已带入 {plannerHandoff.selected_items.length} 个灵感锚点
          </p>
        </section>
      </main>
    );
  }

  return <HomeScreen onPlannerHandoff={setPlannerHandoff} onOpenSettings={() => setView('settings')} />;
}
