import type { Computed } from '../logic';
import { Flame, Segs, Sprite } from './ui';

export function Hero({ name, C }: { name: string; C: Computed }) {
  return (
    <header className="hero panel">
      <div className="portrait">
        <Sprite level={C.level} cape={C.best >= 7} size={76} />
      </div>
      <div className="hero-main">
        <div className="row">
          <span className="ps" style={{ fontSize: 14 }}>{name}</span>
          <span className="ps gold" style={{ fontSize: 12 }}>SEV {C.level}</span>
        </div>
        <Segs pct={C.cur / C.next} n={20} />
        <div className="row muted small">
          <span>XP {C.cur}/{C.next}</span>
          <span className="flame"><Flame /><span>SERİ {C.streak}</span></span>
        </div>
      </div>
    </header>
  );
}
