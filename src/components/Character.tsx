import { STAT, STAT_KEYS, titleOf, type Computed } from '../logic';
import { Segs, Sprite } from './ui';

export function Character({ name, C }: { name: string; C: Computed }) {
  const cape = C.best >= 7;
  const items: [string, number, string][] = [
    ['Ahşap dal, gri kıyafet', 1, '#8a5a2b'],
    ['Mavi tunik + çelik kılıç', 3, '#3b6fd4'],
    ['Çelik zırh + miğfer + kalkan', 5, '#9fb4c9'],
    ['Altın zırh + tüylü miğfer', 8, '#ffc933']
  ];
  return (
    <>
      <div className="sec">KARAKTER</div>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 18, background: 'var(--panel2)' }}>
        <Sprite level={C.level} cape={cape} size={128} />
        <span className="ps" style={{ fontSize: 14 }}>{name}</span>
        <span className="gold">Unvan: {titleOf(C.level)} · SEV {C.level}</span>
      </div>

      <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {STAT_KEYS.map((k) => {
          const xp = C.stat[k];
          const lv = 1 + Math.floor(xp / 100);
          return (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="row">
                <span style={{ color: STAT[k].c }}>{STAT[k].n}</span>
                <span className="muted small">SEV {lv} · {xp} XP</span>
              </div>
              <Segs pct={(xp % 100) / 100} n={10} color={STAT[k].c} />
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ padding: '14px 16px' }}>
        <div className="ps muted" style={{ fontSize: 10, marginBottom: 6 }}>EKİPMAN</div>
        {items.map(([label, lvl, color]) => {
          const open = C.level >= lvl;
          return (
            <div className="eq" key={label}>
              <i style={{ background: open ? color : '#3a2f7a' }} />
              <span style={{ color: open ? 'var(--cream)' : 'var(--muted)' }}>{label}</span>
              <span className="muted small" style={{ marginLeft: 'auto' }}>{open ? 'AÇIK' : 'SEV ' + lvl}</span>
            </div>
          );
        })}
        <div className="eq">
          <i style={{ background: cape ? '#b3263e' : '#3a2f7a' }} />
          <span style={{ color: cape ? 'var(--cream)' : 'var(--muted)' }}>Kızıl pelerin</span>
          <span className="muted small" style={{ marginLeft: 'auto' }}>{cape ? 'AÇIK' : '7 GÜN SERİ'}</span>
        </div>
      </div>
    </>
  );
}
