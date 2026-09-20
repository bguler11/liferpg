import { useMemo, useState } from 'react';
import { compute, defaults, migrate, type AppState, type Habit } from './logic';
import { useSync, useToday } from './store';
import { usePush } from './push';
import { Character } from './components/Character';
import { Hero } from './components/Hero';
import { Login } from './components/Login';
import { MapView } from './components/MapView';
import { Modal, Sheet } from './components/Overlays';
import { Settings } from './components/Settings';
import { Today } from './components/Today';
import { Nav, type Tab } from './components/ui';

export default function App() {
  const today = useToday();
  const { state, update, replace, user, status, signIn, signOut, authError, configured } = useSync(today);
  const { push, enablePush, disablePush, setPushHour } = usePush(user?.uid ?? null);
  const [tab, setTab] = useState<Tab>('today');
  const [sheet, setSheet] = useState<string | null>(null);
  const C = useMemo(() => compute(state, today), [state, today]);

  if (configured && !user) {
    return <Login loading={user === undefined} error={authError} onSignIn={signIn} />;
  }

  /** Değişikliği uygular; XP kaybı seviyeyi düşürdüyse "görülen seviye"yi de indirir. */
  const commit = (mut: (s: AppState) => void) =>
    update((s) => {
      mut(s);
      const c = compute(s, today);
      if (c.level < s.seenLevel) s.seenLevel = c.level;
    });
  const todayLog = (s: AppState) => (s.logs[today] ??= { levels: {} });

  const habit = sheet ? state.habits.find((h) => h.id === sheet) : undefined;

  return (
    <>
      <main className="app">
        <div className="stack">
          <Hero name={state.name} C={C} />
          {tab === 'today' && (
            <Today
              state={state}
              C={C}
              today={today}
              onOpen={setSheet}
              onFocusText={(t) => commit((s) => { const l = todayLog(s); l.focus = { text: t.slice(0, 140), done: l.focus?.done ?? false }; })}
              onFocusToggle={() => commit((s) => { const l = todayLog(s); l.focus = { text: l.focus?.text ?? '', done: !l.focus?.done }; })}
            />
          )}
          {tab === 'char' && <Character name={state.name} C={C} />}
          {tab === 'map' && <MapView state={state} C={C} today={today} />}
          {tab === 'set' && (
            <Settings
              state={state}
              today={today}
              email={user?.email ?? null}
              status={status}
              onMode={(m) => update((s) => { s.mode = m; })}
              onStartDate={(d) => update((s) => { s.startDate = d; })}
              onStartToday={() => update((s) => { s.startDate = today; })}
              onName={(n) => update((s) => { s.name = (n || 'BARIŞ').slice(0, 14).toLocaleUpperCase('tr'); })}
              onHabit={(id, patch: (h: Habit) => void) => update((s) => { const h = s.habits.find((x) => x.id === id); if (h) patch(h); })}
              onAddHabit={() => update((s) => { s.habits.push({ id: 'h' + Date.now().toString(36), name: 'Yeni görev', cue: '', stat: 'dis', core: false, lv: ['', '', ''] }); })}
              onDelHabit={(id) => update((s) => { s.habits = s.habits.filter((h) => h.id !== id); })}
              onImport={(json) => {
                try {
                  const raw = JSON.parse(json);
                  if (!raw || (raw.v !== 1 && raw.v !== 2)) return false;
                  replace(migrate(raw, today));
                  return true;
                } catch {
                  return false;
                }
              }}
              onReset={() => { replace(defaults(today)); setTab('today'); }}
              onSignOut={() => { void signOut(); }}
              push={push}
              onPushOn={() => { void enablePush(); }}
              onPushOff={() => { void disablePush(); }}
              onPushHour={(h) => { void setPushHour(h); }}
            />
          )}
        </div>
      </main>

      <Nav tab={tab} onTab={(t) => { setTab(t); setSheet(null); window.scrollTo(0, 0); }} />

      {habit && (
        <Sheet
          habit={habit}
          state={state}
          current={state.logs[today]?.levels[habit.id] ?? 0}
          onClose={() => setSheet(null)}
          onSet={(l) => {
            commit((s) => {
              const log = todayLog(s);
              if (l === 0) delete log.levels[habit.id];
              else log.levels[habit.id] = l;
            });
            setSheet(null);
          }}
        />
      )}

      <Modal
        state={state}
        C={C}
        onAckReport={() => update((s) => {
          if (C.lastFinal) s.seenDay = C.lastFinal.d;
          const c = compute(s, today);
          if (c.level < s.seenLevel) s.seenLevel = c.level;
        })}
        onAckLevel={() => update((s) => { s.seenLevel = compute(s, today).level; })}
      />
    </>
  );
}
