import { LV_NAME, STAT, XP_LV, needLevel, prettyDate, tierOf, titleOf, type AppState, type Computed, type Habit } from '../logic';
import { Sprite } from './ui';

export function Sheet({ habit, current, state, onSet, onClose }: { habit: Habit; current: number; state: AppState; onSet: (l: number) => void; onClose: () => void }) {
  const need = needLevel(state);
  const colors = ['', 'var(--orange)', 'var(--green)', 'var(--gold)'];
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet panel" role="dialog" aria-label={habit.name} onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <span className="ps" style={{ fontSize: 13 }}>{habit.name}</span>
          <span style={{ color: STAT[habit.stat].c }}>{STAT[habit.stat].n}</span>
        </div>
        {habit.cue && <span className="muted">Ne zaman: {habit.cue}</span>}
        {[1, 2, 3].map((l) => (
          <button key={l} className={'opt' + (current === l ? ' sel' : '')} onClick={() => onSet(l)}>
            <span className="n" style={{ color: colors[l] }}>
              {LV_NAME[l]} · +{XP_LV[l]} XP{l < need && habit.core ? ' · günü kurtarmaz' : ''}
            </span>
            <span>{habit.lv[l - 1] || 'Tanımlanmadı'}</span>
          </button>
        ))}
        <button className="btn alt" onClick={() => onSet(0)}>GERİ AL</button>
      </div>
    </div>
  );
}

export function Modal({ state, C, onAckReport, onAckLevel }: { state: AppState; C: Computed; onAckReport: () => void; onAckLevel: () => void }) {
  if (C.unseen.length && C.lastFinal) {
    const x = C.lastFinal;
    const ok = x.status === 'ok';
    const msg = ok
      ? 'Zincir sağlam. Devam.'
      : state.mode === 'hard' ? 'Zincir koptu. Bugün sıfırdan, daha sert.' : 'Zincir koptu. Bugün yeniden başla.';
    return (
      <div className="overlay center">
        <div className="modal panel" role="dialog">
          <span className={'ps ' + (ok ? 'green' : 'red')} style={{ fontSize: 16, lineHeight: 1.5 }}>{ok ? 'DÜN TAMAM' : 'DÜN BAŞARISIZ'}</span>
          <span className="muted">Gün {x.i + 1} · {prettyDate(x.d)}</span>
          <span style={{ fontSize: 26 }}>{x.delta >= 0 ? '+' : ''}{x.delta} XP</span>
          <span>Seri: {x.streakAfter}</span>
          <span className="muted">{msg}</span>
          {C.unseen.length > 1 && <span className="orange">{C.unseen.length} gün rapor edilmemiş, son gün gösteriliyor.</span>}
          <button className="btn" onClick={onAckReport}>DEVAM</button>
        </div>
      </div>
    );
  }
  if (C.level > state.seenLevel) {
    const newTier = tierOf(C.level) > tierOf(state.seenLevel);
    return (
      <div className="overlay center">
        <div className="modal panel" role="dialog">
          <span className="ps gold" style={{ fontSize: 18, lineHeight: 1.5 }}>SEVİYE ATLADIN!</span>
          <div style={{ background: 'var(--panel2)', padding: 12, boxShadow: 'inset 0 0 0 4px var(--gold)' }}>
            <Sprite level={C.level} cape={C.best >= 7} size={128} />
          </div>
          <span className="ps" style={{ fontSize: 14 }}>SEV {state.seenLevel} → <span className="gold">SEV {C.level}</span></span>
          <span className="muted">Unvan: {titleOf(C.level)}</span>
          {newTier && <span className="gold">Yeni ekipman açıldı!</span>}
          <button className="btn" onClick={onAckLevel}>DEVAM</button>
        </div>
      </div>
    );
  }
  return null;
}
