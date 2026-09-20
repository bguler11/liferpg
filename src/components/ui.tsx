import type { ReactElement } from 'react';
import { spriteSvg } from '../sprite';

export function Segs({ pct, n, color }: { pct: number; n: number; color?: string }) {
  const f = Math.round(Math.max(0, Math.min(1, pct)) * n);
  return (
    <div className="bar" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < f ? 'on' : ''} style={i < f && color ? { background: color } : undefined} />
      ))}
    </div>
  );
}

export function Sprite({ level, cape, size }: { level: number; cape: boolean; size: number }) {
  return <span style={{ display: 'block', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: spriteSvg(level, cape, size) }} />;
}

export function Flame() {
  return (
    <svg viewBox="0 0 7 9" width="14" height="18" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="3" y="0" width="1" height="1" fill="#ff9f4a" />
      <rect x="3" y="1" width="2" height="1" fill="#ff9f4a" />
      <rect x="2" y="2" width="3" height="1" fill="#ff9f4a" />
      <rect x="1" y="3" width="5" height="2" fill="#ff9f4a" />
      <rect x="0" y="5" width="7" height="2" fill="#ff9f4a" />
      <rect x="1" y="7" width="5" height="1" fill="#ff9f4a" />
      <rect x="2" y="8" width="3" height="1" fill="#ff9f4a" />
      <rect x="3" y="4" width="1" height="1" fill="#ffd166" />
      <rect x="2" y="5" width="3" height="2" fill="#ffd166" />
    </svg>
  );
}

export type Tab = 'today' | 'char' | 'map' | 'set';
const ICONS: Record<Tab, ReactElement> = {
  today: (
    <svg viewBox="0 0 10 10" width="26" height="26" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="2" height="2" /><rect x="3" y="0" width="7" height="2" />
      <rect x="0" y="4" width="2" height="2" /><rect x="3" y="4" width="7" height="2" />
      <rect x="0" y="8" width="2" height="2" /><rect x="3" y="8" width="7" height="2" />
    </svg>
  ),
  char: (
    <svg viewBox="0 0 10 10" width="26" height="26" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="1" y="0" width="8" height="1" /><rect x="0" y="1" width="10" height="5" />
      <rect x="1" y="6" width="8" height="1" /><rect x="2" y="7" width="6" height="1" />
      <rect x="3" y="8" width="4" height="1" /><rect x="4" y="9" width="2" height="1" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 11 11" width="26" height="26" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      {[0, 4, 8].flatMap((y) => [0, 4, 8].map((x) => <rect key={x + '-' + y} x={x} y={y} width="3" height="3" />))}
    </svg>
  ),
  set: (
    <svg viewBox="0 0 10 10" width="26" height="26" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="0" width="2" height="10" /><rect x="0" y="4" width="10" height="2" /><rect x="2" y="2" width="6" height="6" />
    </svg>
  )
};
const TABS: [Tab, string][] = [['today', 'GÖREVLER'], ['char', 'KARAKTER'], ['map', '66 GÜN'], ['set', 'AYAR']];

export function Nav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="nav" aria-label="Ana gezinme">
      {TABS.map(([id, label]) => (
        <button key={id} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => onTab(id)}>
          {ICONS[id]}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
