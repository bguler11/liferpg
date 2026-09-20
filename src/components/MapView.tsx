import { addDays, prettyDate, type AppState, type Computed, type DayResult } from '../logic';
import { Segs } from './ui';

export function MapView({ state, C, today }: { state: AppState; C: Computed; today: string }) {
  const byIdx = new Map<number, DayResult>(C.days.map((x) => [x.i, x]));
  const finalized = C.days.filter((x) => x.d !== today);
  const okN = finalized.filter((x) => x.status === 'ok').length;
  const pct = finalized.length ? Math.round((okN / finalized.length) * 100) : 0;
  const dn = Math.max(0, Math.min(C.dayNum, state.total));

  return (
    <>
      <div className="sec">66 GÜN</div>
      <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row">
          <span className="ps" style={{ fontSize: 16 }}>GÜN {dn}/{state.total}</span>
          <span className="gold">%{Math.round((dn / state.total) * 100)}</span>
        </div>
        <Segs pct={dn / state.total} n={22} />
      </div>

      <div className="stat3">
        <div className="panel"><span className="muted small">TUTARLILIK</span><span className="ps green" style={{ fontSize: 16 }}>%{pct}</span></div>
        <div className="panel"><span className="muted small">SERİ</span><span className="ps orange" style={{ fontSize: 16 }}>{C.streak}</span></div>
        <div className="panel"><span className="muted small">EN İYİ SERİ</span><span className="ps" style={{ fontSize: 16, color: 'var(--cyan)' }}>{C.best}</span></div>
      </div>

      <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="grid66" role="img" aria-label={`${state.total} günlük ilerleme haritası`}>
          {Array.from({ length: state.total }, (_, i) => {
            const x = byIdx.get(i);
            return <div key={i} className={'cell' + (x ? ' ' + x.status : '')} />;
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--green)' }} />Tamam</span>
          <span><i style={{ background: '#8a5a2b' }} />Kısmen</span>
          <span><i style={{ background: '#7a2a3a' }} />Başarısız</span>
          <span><i style={{ background: 'var(--gold)' }} />Bugün</span>
        </div>
      </div>

      <div className="panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ps muted" style={{ fontSize: 10 }}>İLK HAFTA</div>
        {Array.from({ length: 7 }, (_, d) => {
          const x = byIdx.get(d);
          let label = 'bekliyor';
          let color = 'var(--muted)';
          if (x?.status === 'ok') { label = `tamam · +${x.delta} XP`; color = 'var(--green)'; }
          else if (x?.status === 'live') { label = 'bugün · devam ediyor'; color = 'var(--gold)'; }
          else if (x) { label = `${x.status === 'part' ? 'kısmen' : 'başarısız'} · ${x.delta >= 0 ? '+' : ''}${x.delta} XP`; color = 'var(--red)'; }
          return (
            <div className="hrow" key={d}>
              <span>Gün {d + 1} · {prettyDate(addDays(state.startDate, d))}</span>
              <span style={{ color }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ps muted" style={{ fontSize: 10 }}>KİLOMETRE TAŞLARI</div>
        <div className="stat3" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }}>
          {[7, 21, 33, 66].map((m) => {
            const open = C.dayNum > m;
            return (
              <div key={m} style={{ background: 'var(--lo)', padding: '10px 4px', textAlign: 'center', boxShadow: 'inset 0 0 0 4px var(--hi)' }}>
                <div style={{ color: open ? 'var(--gold)' : 'var(--muted)' }}>GÜN {m}</div>
                <div className="small muted">{open ? 'Açıldı' : C.started ? Math.max(0, m - C.dayNum + 1) + ' gün' : '—'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
