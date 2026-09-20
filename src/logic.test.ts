import { describe, expect, it } from 'vitest';
import { addDays, compute, defaults, migrate, thr, type AppState } from './logic';

const TODAY = '2026-09-24';

function scenario(mode: 'hard' | 'normal' = 'hard'): AppState {
  const s = defaults(TODAY);
  s.mode = mode;
  s.startDate = addDays(TODAY, -3); // 09-21
  const full = { h1: 2, h2: 2, h3: 2, h4: 2, h5: 2, h6: 3 };
  s.logs[addDays(TODAY, -3)] = { levels: { ...full } };          // gün 1: tamam
  s.logs[addDays(TODAY, -2)] = { levels: { h1: 2, h2: 1 } };     // gün 2: başarısız (kısmen)
  s.logs[addDays(TODAY, -1)] = { levels: { ...full } };          // gün 3: tamam
  s.logs[TODAY] = { levels: { h1: 2, h2: 2 } };                  // gün 4: devam ediyor
  return s;
}

describe('compute (zor mod)', () => {
  const c = compute(scenario(), TODAY);

  it('gün durumlarını doğru sınıflar', () => {
    expect(c.days.map((d) => d.status)).toEqual(['ok', 'part', 'ok', 'live']);
    expect(c.dayNum).toBe(4);
  });
  it('XP: bonuslar ve ceza', () => {
    // gün1: 50+16 +20+2 = 88 | gün2: 14-40 = -26 | gün3: 66+20+2 = 88 | bugün: 20
    expect(c.days[0].delta).toBe(88);
    expect(c.days[1].delta).toBe(-26);
    expect(c.days[2].delta).toBe(88);
    expect(c.xp).toBe(170);
  });
  it('seri ve seviye', () => {
    expect(c.streak).toBe(1);
    expect(c.best).toBe(1);
    expect(c.level).toBe(2);
    expect(c.cur).toBe(170 - thr(2));
  });
  it('dünkü rapor gösterilmemiş sayılır', () => {
    expect(c.unseen).toHaveLength(3);
    expect(c.lastFinal?.d).toBe(addDays(TODAY, -1));
  });
});

describe('modlar', () => {
  it('normal modda MİN yeterli, ceza yok', () => {
    const s = scenario('normal');
    s.logs[addDays(TODAY, -2)] = { levels: { h1: 1, h2: 1, h3: 1, h4: 1, h5: 1 } };
    const c = compute(s, TODAY);
    expect(c.days[1].status).toBe('ok');
    expect(c.streak).toBe(3);
  });
  it('zor modda MİN günü kurtarmaz', () => {
    const s = scenario('hard');
    s.logs[addDays(TODAY, -2)] = { levels: { h1: 1, h2: 1, h3: 1, h4: 1, h5: 1 } };
    expect(compute(s, TODAY).days[1].status).toBe('part');
  });
  it('XP 0 altına inmez', () => {
    const s = defaults(TODAY);
    s.startDate = addDays(TODAY, -2);
    expect(compute(s, TODAY).xp).toBe(0);
  });
  it('bugün tamamlanınca seri canlı artar', () => {
    const s = scenario();
    s.logs[TODAY] = { levels: { h1: 2, h2: 2, h3: 2, h4: 2, h5: 2 } };
    const c = compute(s, TODAY);
    expect(c.todayOk).toBe(true);
    expect(c.streak).toBe(2);
  });
  it('başlamadan önce boş hesaplar', () => {
    const c = compute(defaults(TODAY), TODAY);
    expect(c.started).toBe(false);
    expect(c.days).toHaveLength(0);
  });
});

describe('migrate', () => {
  it('v1 (tek dosya) verisini v2 şekline çevirir', () => {
    const v1 = {
      v: 1, name: 'BARIŞ', startDate: '2026-09-21', total: 66, mode: 'hard', seenLevel: 2, seenDay: null, updatedAt: 5,
      habits: [{ id: 'h1', name: 'Hareket', cue: '', stat: 'str', core: true, lv: ['a', 'b', 'c'] }],
      logs: { '2026-09-21': { h1: 2, focus: { text: 'x', done: true } } }
    };
    const s = migrate(v1, TODAY);
    expect(s.v).toBe(2);
    expect(s.logs['2026-09-21'].levels.h1).toBe(2);
    expect(s.logs['2026-09-21'].focus).toEqual({ text: 'x', done: true });
  });
  it('bozuk veride varsayılana döner', () => {
    expect(migrate(null, TODAY).habits.length).toBeGreaterThan(0);
    expect(migrate({ v: 99 }, TODAY).v).toBe(2);
  });
});
