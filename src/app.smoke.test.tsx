import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';
import { Character } from './components/Character';
import { MapView } from './components/MapView';
import { Modal, Sheet } from './components/Overlays';
import { Settings } from './components/Settings';
import { Today } from './components/Today';
import { addDays, compute, defaults } from './logic';

const TODAY = '2026-09-24';
const s = defaults(TODAY);
s.startDate = addDays(TODAY, -3);
s.logs[addDays(TODAY, -3)] = { levels: { h1: 2, h2: 2, h3: 2, h4: 2, h5: 2, h6: 3 } };
s.logs[addDays(TODAY, -2)] = { levels: { h1: 2 } };
s.logs[TODAY] = { levels: { h1: 2, h2: 1 }, focus: { text: 'Raporu bitir', done: false } };
const C = compute(s, TODAY);
const noop = () => undefined;

describe('arayüz duman testi', () => {
  it('App ilk açılışta render olur (başlamamış gün)', () => {
    const html = renderToString(<App />);
    expect(html).toContain('GÖREVLER');
    expect(html).toContain('BAŞLANGIÇ');
  });
  it('Bugün: görevler, yetersiz etiketi, odak', () => {
    const html = renderToString(<Today state={s} C={C} today={TODAY} onOpen={noop} onFocusText={noop} onFocusToggle={noop} />);
    expect(html).toContain('Hareket');
    expect(html).toContain('YETERSİZ');
    expect(html).toContain('Raporu bitir');
    expect(html).toContain('ZOR MOD');
  });
  it('Karakter, 66 gün, ayarlar render olur', () => {
    expect(renderToString(<Character name="BARIŞ" C={C} />)).toContain('EKİPMAN');
    const map = renderToString(<MapView state={s} C={C} today={TODAY} />);
    expect(map).toContain('İLK HAFTA');
    expect(map).toContain('KİLOMETRE TAŞLARI');
    const set = renderToString(
      <Settings state={s} today={TODAY} email="a@b.c" status="synced" onMode={noop} onStartDate={noop} onStartToday={noop}
        onName={noop} onHabit={noop} onAddHabit={noop} onDelHabit={noop} onImport={() => true} onReset={noop} onSignOut={noop}
        push={{ supported: true, on: true, hour: 20, blocked: false, busy: false, error: null }}
        onPushOn={noop} onPushOff={noop} onPushHour={noop} />
    );
    expect(set).toContain('Bulutla senkron');
    expect(set).toContain('a@b.c');
    expect(set).toContain('HATIRLATMA');
  });
  it('Sheet ve rapor penceresi', () => {
    const sheet = renderToString(<Sheet habit={s.habits[0]} current={2} state={s} onSet={noop} onClose={noop} />);
    expect(sheet).toContain('NORMAL');
    const modal = renderToString(<Modal state={s} C={C} onAckReport={noop} onAckLevel={noop} />);
    expect(modal).toMatch(/DÜN (TAMAM|BAŞARISIZ)/);
  });
});
