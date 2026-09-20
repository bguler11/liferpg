import { useState } from 'react';
import { STAT, STAT_KEYS, type AppState, type Habit, type StatKey } from '../logic';
import type { SyncStatus } from '../store';
import { pushConfigured, type PushState } from '../push';
import { rulesText } from './Today';

function TextField({ label, value, onCommit, max = 120 }: { label: string; value: string; onCommit: (v: string) => void; max?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" defaultValue={value} maxLength={max} onBlur={(e) => e.target.value !== value && onCommit(e.target.value)} />
    </label>
  );
}

interface Props {
  state: AppState;
  today: string;
  email: string | null;
  status: SyncStatus;
  onMode: (m: 'hard' | 'normal') => void;
  onStartDate: (d: string) => void;
  onStartToday: () => void;
  onName: (n: string) => void;
  onHabit: (id: string, patch: (h: Habit) => void) => void;
  onAddHabit: () => void;
  onDelHabit: (id: string) => void;
  onImport: (json: string) => boolean;
  onReset: () => void;
  onSignOut: () => void;
  push: PushState;
  onPushOn: () => void;
  onPushOff: () => void;
  onPushHour: (h: number) => void;
}

const STATUS_TXT: Record<SyncStatus, string> = {
  local: 'Yerel mod (Firebase ayarlanmamış)',
  connecting: 'Bağlanıyor…',
  synced: 'Bulutla senkron',
  error: 'Senkron hatası (veri cihazda güvende)'
};

export function Settings(p: Props) {
  const { state } = p;
  const [arm, setArm] = useState<string | null>(null);
  const [backup, setBackup] = useState('');
  const armed = (key: string, fn: () => void) => () => {
    if (arm === key) { setArm(null); fn(); }
    else { setArm(key); window.setTimeout(() => setArm((a) => (a === key ? null : a)), 4000); }
  };

  return (
    <>
      <div className="sec">AYARLAR</div>

      <div className="panel banner">
        <b>MOD</b>
        <div className="btns">
          <button className={'btn ' + (state.mode === 'hard' ? '' : 'alt')} onClick={() => p.onMode('hard')}>ZOR</button>
          <button className={'btn ' + (state.mode === 'normal' ? '' : 'alt')} onClick={() => p.onMode('normal')}>NORMAL</button>
        </div>
        <span className="muted small">{rulesText(state)}</span>
      </div>

      <div className="panel banner">
        <b>BAŞLANGIÇ TARİHİ</b>
        <input type="date" key={state.startDate} defaultValue={state.startDate} aria-label="Başlangıç tarihi" onChange={(e) => e.target.value && p.onStartDate(e.target.value)} />
        <button className="btn alt" onClick={p.onStartToday}>BUGÜN BAŞLA ({p.today})</button>
      </div>

      <div className="panel banner">
        <b>İSİM</b>
        <input type="text" key={state.name} defaultValue={state.name} maxLength={14} aria-label="İsim" onBlur={(e) => e.target.value !== state.name && p.onName(e.target.value)} />
      </div>

      <div className="sec">GÖREVLER</div>
      {state.habits.map((h) => (
        <div className="panel banner" style={{ gap: 10 }} key={h.id}>
          <TextField key={h.id + 'n' + h.name} label="Ad" value={h.name} max={40} onCommit={(v) => p.onHabit(h.id, (x) => { x.name = v || 'Görev'; })} />
          <TextField key={h.id + 'c' + h.cue} label="Tetikleyici (ne zaman?)" value={h.cue} max={80} onCommit={(v) => p.onHabit(h.id, (x) => { x.cue = v; })} />
          <TextField key={h.id + 'l0' + h.lv[0]} label="MİN (kötü gün versiyonu)" value={h.lv[0]} onCommit={(v) => p.onHabit(h.id, (x) => { x.lv[0] = v; })} />
          <TextField key={h.id + 'l1' + h.lv[1]} label="NORMAL (asıl hedef)" value={h.lv[1]} onCommit={(v) => p.onHabit(h.id, (x) => { x.lv[1] = v; })} />
          <TextField key={h.id + 'l2' + h.lv[2]} label="GÜÇLÜ (ekstra)" value={h.lv[2]} onCommit={(v) => p.onHabit(h.id, (x) => { x.lv[2] = v; })} />
          <label className="field">
            <span>Stat</span>
            <select value={h.stat} onChange={(e) => p.onHabit(h.id, (x) => { x.stat = e.target.value as StatKey; })}>
              {STAT_KEYS.map((k) => <option key={k} value={k}>{STAT[k].n}</option>)}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={h.core} onChange={(e) => p.onHabit(h.id, (x) => { x.core = e.target.checked; })} />
            Çekirdek görev (günü başarılı saymak için zorunlu)
          </label>
          <button className="btn danger" onClick={armed('del:' + h.id, () => p.onDelHabit(h.id))}>
            {arm === 'del:' + h.id ? 'EMİN MİSİN? TEKRAR DOKUN' : 'GÖREVİ SİL'}
          </button>
        </div>
      ))}
      <button className="btn alt" onClick={p.onAddHabit}>+ YENİ GÖREV</button>

      <div className="panel banner">
        <b>HESAP</b>
        <span className="muted">{p.email ?? 'Giriş yapılmadı'}</span>
        <span className={p.status === 'error' ? 'orange' : 'green'}>{STATUS_TXT[p.status]}</span>
        {p.email && <button className="btn alt" onClick={p.onSignOut}>ÇIKIŞ YAP</button>}
      </div>

      <div className="panel banner">
        <b>HATIRLATMA</b>
        <PushPanel {...p} />
      </div>

      <div className="panel banner">
        <b>YEDEK / TAŞIMA</b>
        <textarea
          value={backup}
          onChange={(e) => setBackup(e.target.value)}
          aria-label="Yedek verisi"
          placeholder="Eski uygulamadan aldığın yedeği buraya yapıştırıp İÇE AKTAR'a bas. Ya da YEDEĞİ GÖSTER ile bu uygulamanın yedeğini al."
        />
        <div className="btns">
          <button className="btn alt" onClick={() => setBackup(JSON.stringify(state))}>YEDEĞİ GÖSTER</button>
          <button className="btn alt" onClick={() => { if (!p.onImport(backup)) setBackup('Geçersiz yedek.'); else setBackup(''); }}>İÇE AKTAR</button>
        </div>
      </div>

      <button className="btn danger" onClick={armed('reset', p.onReset)}>
        {arm === 'reset' ? 'TÜM İLERLEME SİLİNECEK. TEKRAR DOKUN' : 'HER ŞEYİ SIFIRLA'}
      </button>
    </>
  );
}

const HOURS = [7, 8, 9, 12, 18, 19, 20, 21, 22, 23];

function PushPanel(p: Props) {
  const { push } = p;
  const hourSel = (
    <label className="field">
      <span>Saat (kendi saat diliminde)</span>
      <select value={push.hour} onChange={(e) => p.onPushHour(Number(e.target.value))}>
        {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
      </select>
    </label>
  );

  if (!pushConfigured) return <span className="muted small">Bildirim anahtarı (VAPID) ayarlanmamış. .env dosyasına eklenince açılır.</span>;
  if (push.supported === null) return <span className="muted small">Kontrol ediliyor…</span>;
  if (push.supported === false)
    return (
      <span className="muted small">
        Bu tarayıcı bildirim göndermiyor. iPhone'da çalışması için uygulamayı <b>Ana Ekrana Ekle</b> ile kurup oradan aç.
      </span>
    );

  return (
    <>
      <span className="muted small">
        {push.on
          ? 'Açık. Günün çekirdek görevleri bitmediyse hatırlatma gelir; bittiyse gelmez.'
          : 'Akşam görevlerini unutursan telefonuna bildirim gelsin.'}
      </span>
      {hourSel}
      {push.blocked && <span className="orange small">Bildirimler tarayıcı ayarlarından engellenmiş. Site ayarlarından izin verip tekrar dene.</span>}
      {push.error && <span className="orange small">{push.error}</span>}
      <button className={'btn ' + (push.on ? 'alt' : '')} disabled={push.busy} onClick={push.on ? p.onPushOff : p.onPushOn}>
        {push.busy ? 'BEKLE…' : push.on ? 'BU CİHAZDA KAPAT' : 'BU CİHAZDA AÇ'}
      </button>
    </>
  );
}
