export type StatKey = 'str' | 'int' | 'dis' | 'con' | 'wis';
export type Mode = 'hard' | 'normal';
export type Lv3 = [string, string, string];

export interface Habit {
  id: string;
  name: string;
  cue: string;
  stat: StatKey;
  core: boolean;
  lv: Lv3;
}
export interface Focus {
  text: string;
  done: boolean;
}
export interface DayLog {
  levels: Record<string, number>;
  focus?: Focus;
}
export interface AppState {
  v: 2;
  name: string;
  startDate: string;
  total: number;
  mode: Mode;
  seenLevel: number;
  seenDay: string | null;
  updatedAt: number;
  habits: Habit[];
  logs: Record<string, DayLog>;
}

export const STAT: Record<StatKey, { n: string; c: string }> = {
  str: { n: 'GÜÇ', c: '#ff8a6b' },
  int: { n: 'ZEKA', c: '#4fc3f7' },
  dis: { n: 'DİSİPLİN', c: '#b48cff' },
  con: { n: 'DAYANIKLILIK', c: '#5ee08a' },
  wis: { n: 'RUH', c: '#ff8fc7' }
};
export const STAT_KEYS: StatKey[] = ['str', 'int', 'dis', 'con', 'wis'];
export const XP_LV = [0, 4, 10, 16];
export const LV_NAME = ['—', 'MİN', 'NORMAL', 'GÜÇLÜ'];
export const DAY_BONUS = 20;
export const FOCUS_XP = 15;
export const PENALTY = 40;
export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/* ---------- tarih yardımcıları (yerel gün, YYYY-MM-DD) ---------- */
const pad = (n: number) => (n < 10 ? '0' : '') + n;
export function ds(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function parseD(s: string): number {
  const p = s.split('-');
  return Date.UTC(+p[0], +p[1] - 1, +p[2]);
}
export function addDays(s: string, n: number): string {
  const d = new Date(parseD(s) + n * 86400000);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}
export function diffDays(a: string, b: string): number {
  return Math.round((parseD(b) - parseD(a)) / 86400000);
}
export function prettyDate(s: string): string {
  const p = s.split('-');
  return +p[2] + ' ' + MONTHS[+p[1] - 1];
}
export function validDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/* ---------- varsayılan durum ---------- */
export function defaults(today: string): AppState {
  return {
    v: 2,
    name: 'BARIŞ',
    startDate: addDays(today, 1),
    total: 66,
    mode: 'hard',
    seenLevel: 1,
    seenDay: null,
    updatedAt: 0,
    habits: [
      { id: 'h1', name: 'Hareket', cue: 'Uyanınca veya işten önce', stat: 'str', core: true,
        lv: ['10 dk yürüyüş veya esneme', '30 dk yürüyüş ya da antrenman', '45+ dk ter döktüren antrenman'] },
      { id: 'h2', name: 'Derin çalışma', cue: 'Telefon başka odada', stat: 'int', core: true,
        lv: ['15 dk kesintisiz', '45 dk kesintisiz, tek iş', '90 dk kesintisiz, tek iş'] },
      { id: 'h3', name: 'Okuma', cue: 'Öğle arası veya yatmadan önce', stat: 'int', core: true,
        lv: ['5 sayfa', '20 sayfa', '40 sayfa'] },
      { id: 'h4', name: 'Telefonu bırak', cue: 'Akşam', stat: 'dis', core: true,
        lv: ['Yatmadan 30 dk önce bırak', "22:30'da telefon şarjda, yatak odası dışında", '22:00 + sabah ilk 30 dk telefon yok'] },
      { id: 'h5', name: 'Erken yat', cue: 'Gece', stat: 'con', core: true,
        lv: ["00:30'a kadar yat", "00:00'a kadar yat", "23:30'a kadar yat"] },
      { id: 'h6', name: 'Günlük yaz', cue: 'Günün sonunda', stat: 'wis', core: false,
        lv: ['1 cümle', '3 satır: ne yaptım, ne öğrendim, yarın ne', '10 dk serbest yazı'] }
    ],
    logs: {}
  };
}

/* v1 (tek dosyalı sürüm) ve v2 verisini temiz bir AppState'e çevirir. */
export function migrate(raw: unknown, today: string): AppState {
  const d = defaults(today);
  if (!raw || typeof raw !== 'object') return d;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = raw as any;
  if (o.v !== 1 && o.v !== 2) return d;

  const logs: Record<string, DayLog> = {};
  for (const [date, l] of Object.entries<any>(o.logs ?? {})) {
    if (!validDate(date) || !l || typeof l !== 'object') continue;
    const levels: Record<string, number> = {};
    const src = o.v === 2 ? (l.levels ?? {}) : l;
    for (const [k, v] of Object.entries<any>(src)) {
      if (k !== 'focus' && typeof v === 'number') levels[k] = v;
    }
    const log: DayLog = { levels };
    if (l.focus && typeof l.focus === 'object') {
      log.focus = { text: String(l.focus.text ?? ''), done: !!l.focus.done };
    }
    logs[date] = log;
  }

  const habits: Habit[] = Array.isArray(o.habits)
    ? o.habits.map((h: any, i: number): Habit => {
        const lv = Array.isArray(h.lv) ? h.lv : [];
        return {
          id: String(h.id ?? 'h' + i),
          name: String(h.name ?? 'Görev'),
          cue: String(h.cue ?? ''),
          stat: (h.stat in STAT ? h.stat : 'dis') as StatKey,
          core: !!h.core,
          lv: [String(lv[0] ?? ''), String(lv[1] ?? ''), String(lv[2] ?? '')]
        };
      })
    : d.habits;

  return {
    v: 2,
    name: typeof o.name === 'string' && o.name ? o.name : d.name,
    startDate: validDate(o.startDate) ? o.startDate : d.startDate,
    total: typeof o.total === 'number' && o.total > 0 ? o.total : 66,
    mode: o.mode === 'normal' ? 'normal' : 'hard',
    seenLevel: typeof o.seenLevel === 'number' && o.seenLevel >= 1 ? o.seenLevel : 1,
    seenDay: validDate(o.seenDay) ? o.seenDay : null,
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : 0,
    habits,
    logs
  };
}

/* ---------- oyun kuralları ---------- */
export function needLevel(s: AppState): number {
  return s.mode === 'hard' ? 2 : 1;
}
export function isOk(s: AppState, log: DayLog | undefined): boolean {
  const core = s.habits.filter((h) => h.core);
  if (!core.length) return false;
  const lv = log?.levels ?? {};
  return core.every((h) => (lv[h.id] ?? 0) >= needLevel(s));
}
export function dayXP(s: AppState, log: DayLog | undefined): { x: number; by: Partial<Record<StatKey, number>> } {
  let x = 0;
  const by: Partial<Record<StatKey, number>> = {};
  const lv = log?.levels ?? {};
  for (const h of s.habits) {
    const v = XP_LV[lv[h.id] ?? 0] ?? 0;
    x += v;
    by[h.stat] = (by[h.stat] ?? 0) + v;
  }
  if (log?.focus?.done) x += FOCUS_XP;
  return { x, by };
}
/** L. seviyeye ulaşmak için gereken toplam XP */
export const thr = (L: number) => 50 * L * (L - 1);
export const tierOf = (L: number) => (L >= 8 ? 3 : L >= 5 ? 2 : L >= 3 ? 1 : 0);
export const titleOf = (L: number) =>
  L >= 11 ? 'Zincir Kıran' : L >= 8 ? 'Disiplin Şövalyesi' : L >= 5 ? 'Yol Yürüyen' : L >= 3 ? 'Yeni Gezgin' : 'Çırak';

export type DayStatus = 'ok' | 'live' | 'part' | 'fail';
export interface DayResult {
  d: string;
  i: number;
  status: DayStatus;
  delta: number;
  streakAfter: number;
}
export interface Computed {
  idx: number;
  started: boolean;
  dayNum: number;
  finished: boolean;
  days: DayResult[];
  xp: number;
  streak: number;
  best: number;
  stat: Record<StatKey, number>;
  level: number;
  cur: number;
  next: number;
  coreDone: number;
  coreTotal: number;
  todayOk: boolean;
  unseen: DayResult[];
  lastFinal: DayResult | null;
}

export function compute(s: AppState, today: string): Computed {
  const idx = diffDays(s.startDate, today);
  const r: Computed = {
    idx, started: idx >= 0, dayNum: idx + 1, finished: idx >= s.total, days: [], xp: 0, streak: 0, best: 0,
    stat: { str: 0, int: 0, dis: 0, con: 0, wis: 0 }, level: 1, cur: 0, next: 100,
    coreDone: 0, coreTotal: 0, todayOk: false, unseen: [], lastFinal: null
  };
  let running = 0, streak = 0, best = 0;
  const last = Math.min(idx, s.total - 1);
  for (let i = 0; i <= last; i++) {
    const d = addDays(s.startDate, i);
    const log = s.logs[d];
    const live = d === today;
    const dx = dayXP(s, log);
    const ok = isOk(s, log);
    let gain = dx.x;
    if (ok) gain += DAY_BONUS + Math.min(streak + 1, 14) * 2;
    const any = s.habits.some((h) => (log?.levels[h.id] ?? 0) > 0);
    let status: DayStatus;
    let delta: number;
    if (live) {
      status = ok ? 'ok' : 'live';
      delta = gain;
      running = Math.max(0, running + gain);
      if (ok) { streak++; best = Math.max(best, streak); }
      r.todayOk = ok;
    } else if (ok) {
      status = 'ok';
      delta = gain;
      streak++;
      best = Math.max(best, streak);
      running = Math.max(0, running + gain);
    } else {
      status = any ? 'part' : 'fail';
      delta = gain - (s.mode === 'hard' ? PENALTY : 0);
      streak = 0;
      running = Math.max(0, running + delta);
    }
    for (const k of STAT_KEYS) r.stat[k] += dx.by[k] ?? 0;
    r.days.push({ d, i, status, delta, streakAfter: streak });
  }
  r.xp = running;
  r.streak = streak;
  r.best = best;
  let L = 1;
  while (thr(L + 1) <= running) L++;
  r.level = L;
  r.cur = running - thr(L);
  r.next = thr(L + 1) - thr(L);
  const core = s.habits.filter((h) => h.core);
  const tl = s.logs[today]?.levels ?? {};
  r.coreTotal = core.length;
  r.coreDone = core.filter((h) => (tl[h.id] ?? 0) >= needLevel(s)).length;
  const fin = r.days.filter((x) => x.d !== today);
  r.lastFinal = fin.length ? fin[fin.length - 1] : null;
  r.unseen = fin.filter((x) => !s.seenDay || x.d > s.seenDay);
  return r;
}
