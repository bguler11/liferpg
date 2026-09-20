import { useEffect, useState } from 'react';
import {
  FOCUS_XP, LV_NAME, PENALTY, STAT, XP_LV, needLevel, prettyDate,
  type AppState, type Computed
} from '../logic';

function timeLeft(): string {
  const n = new Date();
  const m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  const s = Math.max(0, Math.floor((m.getTime() - n.getTime()) / 1000));
  const p = (x: number) => (x < 10 ? '0' : '') + x;
  return p(Math.floor(s / 3600)) + ':' + p(Math.floor((s % 3600) / 60));
}
function untilStart(startDate: string): string {
  const p = startDate.split('-');
  const ms = new Date(+p[0], +p[1] - 1, +p[2]).getTime() - Date.now();
  const h = Math.max(0, Math.ceil(ms / 3600000));
  return h >= 24 ? Math.floor(h / 24) + ' gün ' + (h % 24) + ' saat' : h + ' saat';
}
function Countdown() {
  const [t, setT] = useState(timeLeft);
  useEffect(() => {
    const id = window.setInterval(() => setT(timeLeft()), 20000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="muted">Gün bitimine {t}</span>;
}

export function rulesText(s: AppState): string {
  return s.mode === 'hard'
    ? `ZOR MOD: tüm çekirdek görevler en az NORMAL olmalı. Olmazsa gün başarısız sayılır, seri sıfırlanır, −${PENALTY} XP.`
    : 'NORMAL MOD: tüm çekirdek görevler en az MİN olmalı. Olmazsa seri sıfırlanır, XP kaybı yok.';
}

interface Props {
  state: AppState;
  C: Computed;
  today: string;
  onOpen: (id: string) => void;
  onFocusText: (t: string) => void;
  onFocusToggle: () => void;
}

export function Today({ state, C, today, onOpen, onFocusText, onFocusToggle }: Props) {
  const live = C.started && !C.finished;
  const tl = state.logs[today];
  const focus = tl?.focus ?? { text: '', done: false };
  const need = needLevel(state);

  return (
    <>
      {!C.started ? (
        <div className="panel banner">
          <b className="gold">BAŞLANGIÇ: {prettyDate(state.startDate)}</b>
          <span className="muted">Kalan süre: {untilStart(state.startDate)}. Görevlere bakabilirsin, başlangıç gününde işaretleyebilirsin.</span>
        </div>
      ) : C.finished ? (
        <div className="panel banner">
          <b className="gold">{state.total} GÜN TAMAMLANDI</b>
          <span className="muted">Ayarlardan yeni bir başlangıç tarihi seçebilirsin.</span>
        </div>
      ) : (
        <div className="panel banner">
          <div className="row">
            <b className="gold">GÜN {C.dayNum}/{state.total}</b>
            <Countdown />
          </div>
          <span className="muted small">{rulesText(state)}</span>
        </div>
      )}

      <div className="sec">ÇEKİRDEK {C.coreDone}/{C.coreTotal}{C.todayOk ? ' · GÜN TAMAM' : ''}</div>
      <div className="list">
        {state.habits.map((h) => {
          const l = tl?.levels[h.id] ?? 0;
          const cls = l >= need ? 'ok' : l > 0 ? 'min' : '';
          const mark = l >= need ? 'OK' : l > 0 ? '!' : '';
          const meta =
            `${h.core ? 'ÇEKİRDEK' : 'BONUS'} · ${STAT[h.stat].n} · ` +
            (l ? `${LV_NAME[l]} +${XP_LV[l]} XP` : 'ilerlet') +
            (l > 0 && l < need ? ' · YETERSİZ' : '');
          return (
            <button key={h.id} className={`habit panel ${cls}`} disabled={!live} onClick={() => onOpen(h.id)}>
              <span className="chk">{mark}</span>
              <span className="htxt">
                <span className="t">{h.name}</span>
                <span className="tag" style={{ color: STAT[h.stat].c }}>{meta}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="panel banner">
        <b>GÜNÜN ODAĞI (+{FOCUS_XP} XP)</b>
        <input
          key={today + ':' + focus.text}
          type="text"
          defaultValue={focus.text}
          disabled={!live}
          placeholder="Bugün tek bir şeyi bitirecek olsan ne?"
          aria-label="Günün odağı"
          maxLength={140}
          onBlur={(e) => e.target.value !== focus.text && onFocusText(e.target.value)}
        />
        <button className={'btn ' + (focus.done ? '' : 'alt')} disabled={!live} onClick={onFocusToggle}>
          {focus.done ? 'TAMAMLANDI' : 'TAMAMLADIM'}
        </button>
      </div>
    </>
  );
}
